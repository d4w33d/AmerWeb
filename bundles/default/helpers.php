<?php declare(strict_types=1);

function get_or_create_app_instance(string $uuid): AppInstance
{
    if ($appInstance = get_app_instance_by_uuid($uuid)) return $appInstance;

    return (new AppInstance())
        ->setPingAt(db_now())
        ->setUuid($uuid)
        ->generateSecretToken()
        ->save();
}
