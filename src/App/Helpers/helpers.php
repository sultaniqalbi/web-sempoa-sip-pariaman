<?php

if (!function_exists('env')) {
    function env($key, $default = null) {
        $value = getenv($key);
        if ($value === false) {
            $value = $_ENV[$key] ?? $_SERVER[$key] ?? false;
        }
        return $value !== false ? $value : $default;
    }
}

if (!function_exists('config')) {
    function config($key, $default = null) {
        return \App\Core\Config::get($key, $default);
    }
}

if (!function_exists('auth')) {
    function auth() {
        return $_SESSION['user'] ?? null;
    }
}

if (!function_exists('is_authenticated')) {
    function is_authenticated() {
        return isset($_SESSION['user']) && !is_null($_SESSION['user']);
    }
}

if (!function_exists('can')) {
    function can($role) {
        $user = auth();
        return $user && isset($user['role']) && $user['role'] === $role;
    }
}

if (!function_exists('redirect')) {
    function redirect($url, $code = 302) {
        http_response_code($code);
        header("Location: $url");
        exit;
    }
}

if (!function_exists('json_response')) {
    function json_response($data, $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json');
        return json_encode($data);
    }
}

if (!function_exists('flash')) {
    function flash($key) {
        $value = $_SESSION['flash'][$key] ?? null;
        unset($_SESSION['flash'][$key]);
        return $value;
    }
}

if (!function_exists('set_flash')) {
    function set_flash($key, $value) {
        $_SESSION['flash'][$key] = $value;
    }
}

if (!function_exists('dd')) {
    function dd(...$vars) {
        echo '<pre>';
        foreach ($vars as $var) {
            var_dump($var);
        }
        echo '</pre>';
        exit;
    }
}
