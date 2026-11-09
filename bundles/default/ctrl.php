<?php declare(strict_types=1);

route('/', function(): void
{
    if ($localeCode = get('lang')) {
        set_current_app_locale($localeCode);
        redirect('?/');
    }

    render('home', [ '_view' => 'home' ]);
});
