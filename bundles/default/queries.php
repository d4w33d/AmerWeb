<?php declare(strict_types=1);

// ---{ App Instance }---

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

// ---{ Maps }---

function get_map(object | int | string $map): ?Map { return Map::fetchOneMixed($map); }
function get_map_by_slug(string $slug): ?Map { return Map::fetchOneByPublicSlug($slug); }

function get_map_by_app_instance_and_uuid(AppInstance $appInstance, string $uuid): ?Map
{
    return Map::fetchOne(function(Microbe_Query_Builder $qb) use ($appInstance, $uuid): void
    {
        $qb->where($qb->andX([
            $qb->isEqual('id_app_instance', $appInstance->getId()),
            $qb->isEqual('local_uuid', $uuid),
        ]));
    });
}

function get_map_elements(Map $map): array
{
    return ($qb = db('maps_elements'))
        ->select('*')
        ->where($qb->isEqual('id_map', $map->getId()))
        ->order('position', 'ASC')
        ->limit(999)
        ->all();
}

function clear_map_elements(Map $map): void
{
    ($qb = db('maps_elements'))
        ->where($qb->isEqual('id_map', $map->getId()))
        ->delete();
}

function get_next_map_element_position(Map $map): int
{
    $position = ($qb = db('maps_elements'))
        ->select('position')
        ->where($qb->isEqual('id_map', $map->getId()))
        ->order('position', 'DESC')
        ->limit(1)
        ->value();

    return $position === null ? 0 : (((int) $position) + 1);
}

function add_map_element(
    Map               $map,
    string            $localUuid,
    string            $type,
    ?string           $name,
    DateTimeInterface $createdTime,
    array             $data,
): void
{
    db('maps_elements')->insert([
        'id_map'       => $map->getId(),
        'position'     => get_next_map_element_position($map),
        'local_uuid'   => $localUuid,
        'type'         => $type,
        'name'         => $name,
        'created_time' => $createdTime->format('Y-m-d H:i:s.v'),
        'data'         => json_encode($data),
    ]);
}
