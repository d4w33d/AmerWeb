<?php declare(strict_types=1);

register_domain_route_filter(is_env('dev') ? 'amernav.local' : cfg('@app.domain_name'));

route('/console/maps', function(): void
{
    if (!dev_is_allowed()) throw_403("Not allowed");

    render('@console/default', [
        'app_instances' => get_app_instances()
    ]);
});

clear_route_filters();
