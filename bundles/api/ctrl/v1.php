<?php declare(strict_types=1);

api_route(
    path: 'apps/register',
    method: 'POST',
    skipAppCheck: true,
    callback: function(): void
    {
        if (!($uuid = get_app_instance_uuid_from_api_request())) json_error('missing_app_id', "Missing App ID");
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid)) json_error('invalid_app_id_format', "Invalid App ID Format");

        $appInstance = get_or_create_app_instance($uuid);

        api_success([ 'secret_token' => $appInstance->getSecretToken() ]);
    }
);

api_route(
    path: 'apps/auth',
    method: 'POST',
    assertApp: true,
    assertAppOwner: true,
    callback: function(AppInstance $appInstance): void
    {
        // get_posted('maps'); -> array of uuids

        api_success();
    }
);

api_route(
    path: 'maps',
    method: 'POST',
    assertApp: true,
    assertAppOwner: true,
    callback: function(AppInstance $appInstance): void
    {
        // get_posted('map'); -> map data

        api_success([
            'public_url' => 'https://amernav.com/m/abcdefg',
            'stats' => [
                'nb_visits' => 123,
                'nb_added' => 123,
            ],
        ]);
    }
);
