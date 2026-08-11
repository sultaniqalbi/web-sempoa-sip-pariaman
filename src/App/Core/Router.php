<?php

namespace App\Core;

use App\Exceptions\NotFoundException;
use App\Http\Request;
use App\Http\Response;

class Route
{
    public string $method;
    public string $path;
    public $handler;
    public array $middlewares = [];
    public array $params = [];

    public function __construct(string $method, string $path, $handler)
    {
        $this->method = strtoupper($method);
        $this->path = '/' . trim($path, '/');
        $this->handler = $handler;
    }

    public function middleware(...$middlewares): self
    {
        foreach ($middlewares as $mw) {
            if (is_string($mw)) {
                $parts = explode(',', $mw);
                foreach ($parts as $p) {
                    $p = trim($p);
                    if ($p && !in_array($p, $this->middlewares)) {
                        $this->middlewares[] = $p;
                    }
                }
            }
        }
        return $this;
    }
}

class Router
{
    private Container $container;
    private array $routes = [];
    private array $registeredMiddleware = [];
    private string $groupPrefix = '';
    private array $groupMiddleware = [];

    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    public function registerMiddleware(string $name, string $class): void
    {
        $this->registeredMiddleware[$name] = $class;
    }

    public function addRoute(string $method, string $path, $handler): Route
    {
        $fullPath = $this->groupPrefix . '/' . trim($path, '/');
        $fullPath = '/' . trim($fullPath, '/');

        $route = new Route($method, $fullPath, $handler);

        if (!empty($this->groupMiddleware)) {
            $route->middleware(...$this->groupMiddleware);
        }

        $this->routes[] = $route;
        return $route;
    }

    public function get(string $path, $handler): Route
    {
        return $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, $handler): Route
    {
        return $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, $handler): Route
    {
        return $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, $handler): Route
    {
        return $this->addRoute('DELETE', $path, $handler);
    }

    public function group(string $prefix, array $attributes, callable $callback): void
    {
        $previousGroupPrefix = $this->groupPrefix;
        $previousGroupMiddleware = $this->groupMiddleware;

        $this->groupPrefix = $previousGroupPrefix . '/' . trim($prefix, '/');

        if (isset($attributes['middleware'])) {
            $mw = $attributes['middleware'];
            $mwArray = is_array($mw) ? $mw : explode(',', $mw);
            $this->groupMiddleware = array_merge($previousGroupMiddleware, array_map('trim', $mwArray));
        }

        $callback($this);

        $this->groupPrefix = $previousGroupPrefix;
        $this->groupMiddleware = $previousGroupMiddleware;
    }

    public function dispatch(string $method, string $path)
    {
        $path = '/' . trim(parse_url($path, PHP_URL_PATH), '/');
        $method = strtoupper($method);

        foreach ($this->routes as $route) {
            if ($route->method !== $method && $route->method !== 'ANY') {
                continue;
            }

            if ($this->matchPattern($route->path, $path, $params)) {
                $route->params = $params;
                return $this->handleRoute($route);
            }
        }

        throw new NotFoundException("Route [$method $path] not found.");
    }

    private function matchPattern(string $routePath, string $requestPath, &$params): bool
    {
        $params = [];

        // Convert route params :id or {id} to regex named groups
        $pattern = preg_replace('/:([a-zA-Z0-9_]+)/', '(?P<$1>[^/]+)', $routePath);
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $pattern);
        $pattern = '#^' . $pattern . '$#';

        if (preg_match($pattern, $requestPath, $matches)) {
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $params[$key] = $value;
                }
            }
            return true;
        }

        return false;
    }

    private function handleRoute(Route $route)
    {
        $request = $this->container->has(Request::class) 
            ? $this->container->get(Request::class) 
            : new Request();

        $response = $this->container->has(Response::class)
            ? $this->container->get(Response::class)
            : new Response();

        // Process Middlewares
        foreach ($route->middlewares as $mwName) {
            if (isset($this->registeredMiddleware[$mwName])) {
                $mwClass = $this->registeredMiddleware[$mwName];
                $mwInstance = $this->container->make($mwClass);
                
                if (method_exists($mwInstance, 'handle')) {
                    $mwInstance->handle($request);
                }
            }
        }

        $handler = $route->handler;

        if (is_callable($handler)) {
            return call_user_func_array($handler, array_merge([$request, $response], $route->params));
        }

        if (is_string($handler)) {
            // Format: ControllerName@methodName or Section\ControllerName@methodName
            $parts = explode('@', $handler);
            $controllerName = $parts[0];
            $action = $parts[1] ?? 'index';

            if (!str_contains($controllerName, '\\')) {
                $controllerClass = "App\\Controllers\\{$controllerName}";
            } else {
                $controllerClass = "App\\Controllers\\{$controllerName}";
            }

            $controllerInstance = $this->container->make($controllerClass, [
                'request' => $request,
                'response' => $response
            ]);

            if (!method_exists($controllerInstance, $action)) {
                throw new NotFoundException("Action [$action] on controller [$controllerClass] not found.");
            }

            return call_user_func_array([$controllerInstance, $action], array_merge([$request], $route->params));
        }

        throw new \Exception("Invalid route handler format.");
    }
}
