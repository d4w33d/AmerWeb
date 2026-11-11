<?php declare(strict_types=1);

route('/', function(): void
{
    if ($m = get_nullable_str('m')) redirect('/m/' . $m);
    if ($q = get_nullable_str('q')) redirect('/m', [ 'q' => $q ]);

    if (($lat = get_nullable_str('lat')) && ($lon = get_nullable_str('lon'))) {
        redirect('/m', [ 'q' => $lat . ',' . $lon ]);
    }

    if ($localeCode = get('lang')) {
        set_current_app_locale($localeCode);
        redirect('?/');
    }

    render('home', [ '_view' => 'home' ]);
});
