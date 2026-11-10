
-- $comment: App Instances

CREATE TABLE app_instances (
    id INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uid VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    id_user INTEGER UNSIGNED,
    ping_at DATETIME,
    local_uuid VARCHAR(255) NOT NULL,
    secret_token VARCHAR(128),

    INDEX app_instances_u_idx (uid),
    INDEX app_instances_lu_idx (local_uuid),
    INDEX app_instances_st_idx (secret_token),

    FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE
);
