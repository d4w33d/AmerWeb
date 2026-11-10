<?php declare(strict_types=1);

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
