
-- $comment: Users

CREATE TABLE users (
    id INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uid VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_validated_at DATETIME,
    phone VARCHAR(15),
    phone_validated_at DATETIME,
    password VARCHAR(64),
    password_updated_at DATETIME,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    INDEX users_u_idx (uid),
    INDEX users_e_idx (email)
);

CREATE TABLE users_tokens (
    token VARCHAR(128) PRIMARY KEY,
    id_user INTEGER UNSIGNED NOT NULL,
    type VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME,
    meta_data TEXT,
    INDEX users_tokens_tt_idx (token, type),
    FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE users_logins (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_user INTEGER UNSIGNED NOT NULL,
    login_at DATETIME NOT NULL,
    token VARCHAR(128),
    ip_address VARCHAR(45),
    url VARCHAR(255),
    referer VARCHAR(255),
    INDEX users_logins_iu_la_idx (id_user, login_at),
    FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE
);
