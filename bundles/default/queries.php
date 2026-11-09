<?php declare(strict_types=1);

function get_app_instance(object | int | string $appInstance): ?AppInstance { return AppInstance::fetchOneMixed($appInstance); }
function get_app_instance_by_uuid(string $uuid): ?AppInstance { return AppInstance::fetchOneByLocalUuid($uuid); }

function get_app_instances(int $offset = 0, ?int $limit = null): array
{
    return AppInstance::fetchAll(function(Microbe_Query_Builder $qb) use ($offset, $limit): void
    {
        if ($limit) $qb->offset($offset)->limit($limit);
        $qb
            ->clearOrder()
            ->order('ping_at', 'DESC')
            ->order('created_at', 'DESC')
            ->order('id', 'DESC');
    });
}

function count_app_instances(): int { return AppInstance::countAll(); }
