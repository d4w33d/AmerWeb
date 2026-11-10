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
                if (!($uuid = $mapInfo['id']) || !is_uuid($uuid)) continue;
                $isPublic = ($mapInfo['isPublic'] ?? false) === true;

                if (!($map = get_map_by_app_instance_and_uuid($appInstance, $uuid))) continue;
                if ($map->isPublic() !== $isPublic) {
                    if (!$isPublic && $appInstance->getIdUser() === null) $map->delete();
                    else $map->setIsPublic($isPublic)->save();
                }
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
        // sync_map()
        // get_posted('map'); -> map data

        // get_map_by_app_instance_and_uuid

        api_success([
            'public_url' => 'https://amernav.com/m/abcdefg',
            'stats' => [
                'nb_visits' => 123,
                'nb_added' => 123,
            ],
        ]);
    }
);

api_route(path: '/', callback: function(): void { json_success([ 'version' => 1 ]); });
api_route(path: '/<anything*>', callback: function(): void { json_error('not_found', code: 404); });
api_route(path: '/', version: null, callback: function(): void { redirect('https://amernav.com'); });
