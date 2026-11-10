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

function sync_map_public_mode(AppInstance $appInstance, string $uuid, bool $isPublic): void
{
    if (!($map = get_map_by_app_instance_and_uuid($appInstance, $uuid))) return;
    if ($map->isPublic() === $isPublic) return;

    if (!$isPublic && $appInstance->getIdUser() === null) $map->delete();
    else $map->setIsPublic($isPublic)->save();
}

function sync_map_data(AppInstance $appInstance, string $uuid, array $postedData): ?Map
{
    if (!($postedData['isPublic'] ?? false) && $appInstance->getIdUser() === null) return null;

    $map = get_or_create_map($uuid);

    $map
        ->setName(is_string($postedData['name'] ?? null) ? trim($postedData['name']) ?: null : null)
        ->setIsPublic(($postedData['isPublic'] ?? false) === true)
        ->setIsDefault(($postedData['isDefault'] ?? false) === true)
        ->save();

    return $map;

    /*{
        "elements": [
            {
                "type": "com.pointless.amer.domain.model.MapElement.Route",
                "id": "35f4c17b-9e2e-4dd1-96e6-ab6034072384",
                "name": "",
                "createdTime": 1794327930913,
                "points": [
                    {
                        "latitude": 47.64550900018784,
                        "longitude": -3.4076200240745607
                    },
                    {
                        "latitude": 47.65375360630995,
                        "longitude": -3.345774892807981
                    },
                    {
                        "latitude": 47.60261606672756,
                        "longitude": -3.353444341759939
                    }
                ]
            }
        ]
    }*/
}
