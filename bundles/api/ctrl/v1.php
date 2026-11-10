<?php declare(strict_types=1);

api_route(
    path: 'apps/register',
    method: 'POST',
    skipAppCheck: true,
    callback: function(): void
    {
        if (!($uuid = get_app_instance_uuid_from_api_request())) json_error('missing_app_id', "Missing App ID");
        if (!is_uuid($uuid)) json_error('invalid_app_id_format', "Invalid App ID Format");

        $appInstance = get_or_create_app_instance($uuid);

        api_success([ 'secret_token' => $appInstance->getSecretToken() ]);
    }
);

api_route(
    path: 'apps/auth',
    method: 'POST',
    assertApp: true,
    assertAppOwner: true,
    callback: function(AppInstance $appInstance, array $postedData): void
    {
        if (isset($postedData['maps']) && is_array($postedData['maps'])) {
            foreach ($postedData['maps'] as $mapInfo) {
                if (!is_uuid($uuid = ($mapInfo['id'] ?? null))) continue;
                $isPublic = ($mapInfo['isPublic'] ?? false) === true;
                sync_map_public_mode($appInstance, $uuid, $isPublic);
            }
        }

        api_success();
    }
);

api_route(
    path: 'maps',
    method: 'POST',
    assertApp: true,
    assertAppOwner: true,
    callback: function(AppInstance $appInstance, array $postedData): void
    {
        if (!is_uuid($uuid = ($postedData['id'] ?? null))) api_error('invalid_map_id');
        if (!($map = sync_map_data($appInstance, $uuid, $postedData))) api_error('unable_to_create_map');

        api_success([
            'public_url' => $map->getPublicUrl(),
            'stats' => [ 'nb_visits' => 0, 'nb_added' => 0 ],
        ]);
    }
);

api_route(path: '/', callback: function(): void { json_success([ 'version' => 1 ]); });
api_route(path: '/<anything*>', callback: function(): void { json_error('not_found', code: 404); });
api_route(path: '/', version: null, callback: function(): void { redirect('https://amernav.com'); });
