<?php declare(strict_types=1);

return db_table_exists('users')
    && db_table_exists('users_tokens')
    && db_table_exists('users_logins');
