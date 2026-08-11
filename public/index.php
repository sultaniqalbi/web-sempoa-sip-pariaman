<?php
/**
 * Sempoa SIP - Public Entry Point
 */

define('APP_ROOT', dirname(__DIR__));
define('PUBLIC_PATH', __DIR__);
define('SRC_PATH', APP_ROOT . '/src');
define('STORAGE_PATH', APP_ROOT . '/storage');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once APP_ROOT . '/vendor/autoload.php';

// Helper functions definition
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

// Load .env
if (file_exists(APP_ROOT . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(APP_ROOT);
    $dotenv->safeLoad();
}

// Error reporting settings
error_reporting(E_ALL);
ini_set('display_errors', env('APP_DEBUG', true) ? '1' : '0');
ini_set('log_errors', '1');
ini_set('error_log', STORAGE_PATH . '/logs/php-errors.log');

use App\Core\Application;

try {
    $app = new Application();
    
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
    
    $basePath = str_replace('/index.php', '', $scriptName);
    if (!empty($basePath) && str_starts_with($path, $basePath)) {
        $path = substr($path, strlen($basePath));
    }
    
    // Fallback if URL still has /public (e.g. some web server configs)
    if (str_starts_with($path, '/public/')) {
        $path = substr($path, 7);
    }
    
    $router = $app->get('router');
    $response = $router->dispatch($method, $path);
    
    if (is_array($response)) {
        header('Content-Type: application/json');
        echo json_encode($response);
    } else {
        echo $response;
    }
    
} catch (\App\Exceptions\NotFoundException $e) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage()]);
    
} catch (\App\Exceptions\AuthException $e) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage()]);
    
} catch (\App\Exceptions\ValidationException $e) {
    http_response_code(422);
    header('Content-Type: application/json');
    echo json_encode(['errors' => $e->getErrors()]);
    
} catch (\App\Exceptions\PermissionException $e) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Access denied']);
    
} catch (\Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    
    if (env('APP_DEBUG', true)) {
        echo json_encode([
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => explode("\n", $e->getTraceAsString())
        ]);
    } else {
        echo json_encode(['error' => 'Internal server error']);
    }
}
