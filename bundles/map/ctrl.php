<?php declare(strict_types=1);

route([
    '/m',
    '/m/<mapSlug>',
], function(?string $mapSlug = null): void
{
    $query = get_nullable_str('q');

    $queriedCenter = get_nullable_str('c');

    if (!is_numeric($queriedZoom = get_nullable_str('z'))) $queriedZoom = null;
    if ($queriedZoom !== null) $queriedZoom = round(max(0, min(22, abs((float) $queriedZoom))), 1);

    if (!$mapSlug) $mapSlug = get_nullable_str('m');

    $map = $mapSlug ? get_map_by_slug($mapSlug) ?: throw_404("Invalid map reference") : null;
    if ($map && !$map->isPublic()) throw_404("Map is private");

    $waypoint = null;
    if ($query) {
        if ($coord = parse_coordinate_query($query)) {
            $waypoint = (object) [ 'coordinate' => $coord ];
        }
    }

    $opts = [

        'defaults' => [
            'center' => (object) [ 'lat' => 20.033, 'lon' => -72.784 ],
            'zoom' => 8,
            'waypointZoom' => 10,
        ],

        'queried' => [
            'center' => $queriedCenter ? parse_coordinate_query($queriedCenter) : null,
            'zoom'   => $queriedZoom,
        ],

        'query' => $q,
        'waypoint' => $waypoint,
        'map_data' => $map ? $map->toPublic() : null,

    ];

    render('@map/default', [
        'opts' => $opts,
    ]);
});
