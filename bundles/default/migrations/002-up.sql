
-- $comment: Maps

CREATE TABLE maps (
    id INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uid VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    id_app_instance INTEGER UNSIGNED NOT NULL,
    local_uuid VARCHAR(255) NOT NULL,

    slug VARCHAR(64) NOT NULL,

    name VARCHAR(255),
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,

    INDEX maps_iai_lu_idx (id_app_instance, local_uuid),
    INDEX maps_s_idx (slug),

    FOREIGN KEY (id_app_instance) REFERENCES app_instances(id) ON DELETE CASCADE
);

CREATE TABLE maps_elements (
    id_map INTEGER UNSIGNED NOT NULL,
    position INTEGER UNSIGNED NOT NULL,

    local_uuid VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,

    name VARCHAR(255),
    created_time DATETIME(3),

    data MEDIUMTEXT,

    PRIMARY KEY (id_app, position),
    FOREIGN KEY (id_map) REFERENCES maps(id) ON DELETE CASCADE
);
