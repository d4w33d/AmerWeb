<?php declare(strict_types=1);

function get_app_instance_uuid_from_api_request(): ?string {
    return $_SERVER['HTTP_X_AMER_APPID'] ?? null;
}

function get_app_secret_token_from_api_request(): ?string {
    return $_SERVER['HTTP_X_AMER_SECRETTOKEN'] ?? null;
}

function get_app_instance_from_api_request(): ?AppInstance {
    if (!($uuid = get_app_instance_uuid_from_api_request())) return null;
    return get_app_instance_by_uuid($uuid);
}

function api_route(
    string | array $path,
    ?string        $method         = null,
    bool           $assertApp      = false,
    bool           $assertAppOwner = false,
    bool           $skipAppCheck = false,
    int            $version        = 1,
    ?Closure       $callback       = null,
): void
{
    if ($method !== null && !is_http_method($method)) return;
    $path = rtrim('/api/' . $version . '/' . trim($path, '/'), '/');

    route($path, function() use ($callback)
    {
        $appInstance = null;

        if ($assertAppOwner) $assertApp = true;

        if ($skipAppCheck) {
            $uuid = get_app_instance_uuid_from_api_request();
            if ($assertApp && !$uuid) api_error('missing_app_id', "Missing App ID", code: 403);
            if ($uuid && !($appInstance = get_app_instance_by_uuid($uuid))) api_error('invalid_app_id', "Invalid App ID", code: 403);
            if ($assertAppOwner) {
                if (!($secretToken = get_app_secret_token_from_api_request())) api_error('missing_secret_token', "Missing Secret Token", code: 403);
                if ($appInstance->getSecretToken() != $secretToken) api_error('invalid_secret_token', "Invalid Secret Token", code: 403);
            }
        }

        $args = array_merge([
            $appInstance
        ], func_get_args());

        $callback(...$args);
    });
}

function api_error(
    string                $errorCode    = 'unknown',
    string | array | null $errorMessage = null,
    array                 $data         = [],
    int                   $code         = 200,
): void
{
    if (is_string($errorMessage)) $errorMessage = [ 'message' => $errorMessage ];
    $data = array_merge($errorMessage ?: [], $data);
    json_error($errorCode, $data, code: $code);
}

function api_success(array $data = []): void
{
    json_success($data);
}
