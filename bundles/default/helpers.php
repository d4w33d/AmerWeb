<?php declare(strict_types=1);

function get_public_url(string $url): string
{
    return rtrim('https://' . cfg('domain_name') . '/' . ltrim($url, '/'), '/');
}

function get_or_create_app_instance(string $uuid): AppInstance
{
    if ($appInstance = get_app_instance_by_uuid($uuid)) return $appInstance;

    return (new AppInstance())
        ->setPingAt(db_now())
        ->setLocalUuid($uuid)
        ->generateSecretToken()
        ->save();
}

function get_or_create_map(AppInstance $appInstance, string $uuid): Map
{
    if ($map = get_map_by_app_instance_and_uuid($appInstance, $uuid)) return $map;

    return (new Map())
        ->setIdAppInstance($appInstance->getId())
        ->setLocalUuid($uuid)
        ->generatePublicSlug()
        ->save();
}

function generate_map_public_slug(): string
{
    $slug = null;
    $iterations = 0;
    while ($slug === null || get_map_by_slug($slug)) {
        if (++$iterations < 100) {
            $slug = password(len: 9, changeCase: false, useSpecials: false);
        } else {
            $slug = uid();
        }
    }
    return $slug;
}

function sync_map_public_mode(
    AppInstance $appInstance,
    string      $uuid,
    bool        $isPublic,
): void
{
    if (!($map = get_map_by_app_instance_and_uuid($appInstance, $uuid))) return;
    if ($map->isPublic() === $isPublic) return;

    if (!$isPublic && $appInstance->getIdUser() === null) $map->delete();
    else $map->setIsPublic($isPublic)->save();
}

function sync_map_data(
    AppInstance $appInstance,
    string      $uuid,
    array       $postedData,
): ?Map
{
    if (!($postedData['isPublic'] ?? false) && $appInstance->getIdUser() === null) return null;

    ($map = get_or_create_map($appInstance, $uuid))
        ->setName(is_string($postedData['name'] ?? null) ? trim($postedData['name']) ?: null : null)
        ->setIsPublic(($postedData['isPublic'] ?? false) === true)
        ->setIsDefault(($postedData['isDefault'] ?? false) === true)
        ->save()
        ->clearElements();

    $validDateRange = [ new DateTime(), new DateTime() ];
    $validDateRange[0]->sub(new DateInterval('P90Y'));
    $validDateRange[1]->add(new DateInterval('P1D'));

    if (is_array($postedData['elements'] ?? null)) {
        foreach ($postedData['elements'] as $el) {
            if (!is_array($el)) continue;

            if (!is_uuid($el['id'] ?? null)) continue;

            if (!is_string($el['type'] ?? null)) continue;
            if (!($type = trim(preg_replace('/^(.*\.)?([^.]+)$/', '$2', $el['type'])))) continue;

            if (!is_string($name = ($el['name'] ?? null))) $name = null;
            else $name = trim($name) ?: null;

            if (!is_int_val($createTimeMillis = ($el['createdTime'] ?? null))) continue;
            $createdTime = DateTimeImmutable::createFromFormat('U.u', sprintf('%.3F', $createTimeMillis / 1000));
            if ($createdTime < $validDateRange[0] || $createdTime > $validDateRange[1]) continue;

            if (($elementData = process_map_element_data($type, $el)) === null) continue;

            $map->addElement(
                localUuid:   $uuid,
                type:        $type,
                name:        $name,
                createdTime: $createdTime,
                data:        $elementData,
            );
        }
    }

    return $map;
}


function sanitize_map_element_point_value(mixed $v): ?float
{
    if (is_int($v)) return (float) $v;
    if (is_float($v)) return is_finite($v) ? (float) $v : null;
    return is_string($v) && preg_match('/^-?\d+(\.\d+)?\z/', $v) === 1 ? (float)  $v : null;
}

function sanitize_map_element_point(mixed $point): ?array
{
    if (!is_array($point)) return null;

    $pt = [ 'lat' => null, 'lon' => null ];

    if (isset($point['latitude'])) $pt['lat'] = $point['latitude'];
    else if (isset($point['lat'])) $pt['lat'] = $point['lat'];

    if (isset($point['longitude'])) $pt['lon'] = $point['longitude'];
    else if (isset($point['lon'])) $pt['lon'] = $point['lon'];
    else if (isset($point['lng'])) $pt['lng'] = $point['lng'];

    if ($pt['lat'] === null || $pt['lon'] === null) return null;

    if (($pt['lat'] = sanitize_map_element_point_value($pt['lat'])) === null) return null;
    if (($pt['lon'] = sanitize_map_element_point_value($pt['lon'])) === null) return null;

    return $pt;
}

function sanitize_map_element_points(mixed $points): array
{
    if (!is_array($points)) return [];
    return array_values(array_filter(array_map('sanitize_map_element_point', $points)));
}

function sanitize_map_element_marker_icon(mixed $icon): ?string
{
    return is_string($icon) && in_array($icon, [
        'a_00_default',
        'b_00_boat_ferry',
        'b_01_boat_sailing',
        'z_00_mob',
    ]) ? $icon : null;
}

function sanitize_map_element_color(mixed $color): ?string
{
    return is_string($color) && preg_match('/^\#[0-f]{6}$/i', $color) ? strtoupper($color) : null;
}

function sanitize_map_element_stroke_width(mixed $strokeWidth, bool $noneAllowed = true): ?string
{
    $widths = [ 'thin', 'medium', 'thick' ];
    if ($noneAllowed) $widths[] = 'none';
    return is_string($strokeWidth) && in_array($strokeWidth, $widths) ? $strokeWidth : null;
}

function sanitize_map_element_text(mixed $text): ?string
{
    if (!is_string($text)) return null;
    return trim($text) ?: null;
}

function sanitize_map_element_single_line_text(mixed $text): ?string
{
    return trim(preg_replace('/\s{2,}/', ' ', preg_replace("/[\r\n]/", ' ', sanitize_map_element_text($text) ?: '')) ?: null);
}

function sanitize_map_element_door_type(mixed $doorType): ?string
{
    return is_string($doorType) && in_array($doorType, [
        'START_LINE',
        'FINISH_LINE',
        'GATE',
        'TRANSIT',
        'OBSTRUCTION',
    ]) ? $doorType : null;
}

function process_map_element_data(string $type, array $raw): ?array
{
    $data = [];

var_dump($type);
var_dump($raw);echo "\n\n\n";

    switch ($type) {

        case 'Route':
            if (!($data['points'] = sanitize_map_element_points($raw['points'] ?? null))) return null;
            return $data;

        case 'Waypoint':
            if (($data['point'] = sanitize_map_element_point($raw['point'] ?? null)) === null) return null;
            if (($data['symbolIcon'] = sanitize_map_element_marker_icon($raw['symbolIcon'] ?? null)) === null) return null;
            if (($data['symbolColor'] = sanitize_map_element_color($raw['symbolColor'] ?? null)) === null) return null;
            $data['isMob'] = ($raw['isMob'] ?? false) === true;
            return $data;

        case 'MultiSegmentLine':
            if (!($data['points'] = sanitize_map_element_points($raw['points'] ?? null))) return null;
            if (($data['colorHex'] = sanitize_map_element_color($raw['colorHex'] ?? null)) === null) return null;
            if (($data['strokeWidth'] = sanitize_map_element_stroke_width($raw['strokeWidth'] ?? null, noneAllowed: false)) === null) return null;
            return $data;

        case 'Polygon':
            if (!($data['points'] = sanitize_map_element_points($raw['points'] ?? null))) return null;
            if (($data['colorHex'] = sanitize_map_element_color($raw['colorHex'] ?? null)) === null) return null;
            if (($data['strokeWidth'] = sanitize_map_element_stroke_width($raw['strokeWidth'] ?? null)) === null) return null;
            return $data;

        case 'TextLabel':
            if (($data['point'] = sanitize_map_element_point($raw['point'] ?? null)) === null) return null;
            if (($data['text'] = sanitize_map_element_single_line_text($raw['text'] ?? null)) === null) return null;
            $data['extraText'] = sanitize_map_element_text($raw['extraText'] ?? null) ?: '';
            return $data;

        case 'Door':
            if (($data['p1'] = sanitize_map_element_point($raw['p1'] ?? null)) === null) return null;
            if (($data['p2'] = sanitize_map_element_point($raw['p2'] ?? null)) === null) return null;
            if (($data['doorType'] = sanitize_map_element_door_type($raw['doorType'] ?? null)) === null) return null;
            return $data;

    }

    return null;
}
