<?php declare(strict_types=1);

class Map extends Microbe_Entity
{

    // ---{ Definition }--------------------------------------------------------

    public const CRUD_METHOD = 'db';
    public const TABLE_NAME  = 'maps';

    protected array $fields = [
        [ 'name' => 'id',              'type' => Microbe_Entity::T_INT                         ],
        [ 'name' => 'uid',             'type' => Microbe_Entity::T_STRING                      ],
        [ 'name' => 'created_at',      'type' => Microbe_Entity::T_DATETIME                    ],
        [ 'name' => 'updated_at',      'type' => Microbe_Entity::T_DATETIME                    ],
        [ 'name' => 'id_app_instance', 'type' => Microbe_Entity::T_INT                         ],
        [ 'name' => 'local_uuid',      'type' => Microbe_Entity::T_STRING                      ],
        [ 'name' => 'public_slug',     'type' => Microbe_Entity::T_STRING                      ],
        [ 'name' => 'name',            'type' => Microbe_Entity::T_STRING                      ],
        [ 'name' => 'is_public',       'type' => Microbe_Entity::T_BOOL,    'default' => false ],
        [ 'name' => 'is_default',      'type' => Microbe_Entity::T_BOOL,    'default' => false ],
    ];

    // ---{ Entity Methods }----------------------------------------------------

    public function generatePublicSlug(): static
    {
        return $this->setPublicSlug(generate_map_public_slug());
    }

    public function getPublicUrl(): ?string
    {
        if (!$this->isPublic()) return null;
        if (!($slug = $this->getPublicSlug())) return null;
        return get_public_url("/m/$slug");
    }

    public function clearElements(): static
    {
        //
    }

    /*

    id_map INTEGER UNSIGNED NOT NULL,
    position INTEGER UNSIGNED NOT NULL,

    local_uuid VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,

    name VARCHAR(255),
    created_time DATETIME(3),

    data MEDIUMTEXT,

    */

}
