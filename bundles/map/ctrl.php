<?php declare(strict_types=1);

register_domain_route_filter(is_env('dev') ? 'amernav.local' : cfg('@app.domain_name'));

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
    if ($map && !$map->isPublic()) throw_404('Map is private');

    $waypoint = null;
    if ($query) {
        if ($coord = parse_coordinate_query($query)) {
            $waypoint = (object) [
                'coordinate' => $coord,
                'name'       => get_nullable_str('wpn'),
                'symbol'     => get_nullable_str('wps'),
                'color'      => get_nullable_str('wpc'),
            ];

            if ($waypoint->name && strlen($waypoint->name) > 64) $waypoint->name = substr($waypoint->name, 0, 61) . '...';
            if ($waypoint->symbol) $waypoint->symbol = get_marker_symbol($waypoint->symbol);
            if ($waypoint->color) $waypoint->color = preg_match('/^[a-f0-9]{6}$/i', $waypoint->color) ? '#' . strtolower($waypoint->color) : null;
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
        'map' => $map ? $map->toPublic() : null,

    ];

    render('@map/default', [
        'opts' => $opts,
    ]);
});

clear_route_filters();
