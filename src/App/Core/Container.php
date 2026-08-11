<?php

namespace App\Core;

use ReflectionClass;
use ReflectionMethod;
use ReflectionNamedType;
use Exception;

class Container
{
    private static ?Container $instance = null;
    private array $bindings = [];
    private array $instances = [];

    public function __construct()
    {
        self::$instance = $this;
    }

    public static function getInstance(): Container
    {
        if (self::$instance === null) {
            self::$instance = new static();
        }
        return self::$instance;
    }

    /**
     * Bind a key to a resolver or class name
     */
    public function bind(string $abstract, $concrete = null): void
    {
        if ($concrete === null) {
            $concrete = $abstract;
        }

        $this->bindings[$abstract] = [
            'concrete' => $concrete,
            'shared' => false
        ];
    }

    /**
     * Bind a singleton
     */
    public function singleton(string $abstract, $concrete = null): void
    {
        if ($concrete === null) {
            $concrete = $abstract;
        }

        $this->bindings[$abstract] = [
            'concrete' => $concrete,
            'shared' => true
        ];
    }

    /**
     * Set a shared instance directly
     */
    public function instance(string $abstract, $instance): void
    {
        $this->instances[$abstract] = $instance;
    }

    /**
     * Check if binding exists
     */
    public function has(string $abstract): bool
    {
        return isset($this->bindings[$abstract]) || isset($this->instances[$abstract]);
    }

    /**
     * Get or build an instance
     */
    public function get(string $abstract)
    {
        return $this->make($abstract);
    }

    /**
     * Make an instance with auto-wiring
     */
    public function make(string $abstract, array $parameters = [])
    {
        // Return existing shared instance if available
        if (isset($this->instances[$abstract])) {
            return $this->instances[$abstract];
        }

        $binding = $this->bindings[$abstract] ?? null;

        if ($binding) {
            $concrete = $binding['concrete'];
            $isShared = $binding['shared'];

            if ($concrete instanceof \Closure) {
                $object = $concrete($this, $parameters);
            } elseif (is_string($concrete)) {
                $object = $this->build($concrete, $parameters);
            } else {
                $object = $concrete;
            }

            if ($isShared) {
                $this->instances[$abstract] = $object;
            }

            return $object;
        }

        // If not explicitly bound, try auto-wiring if class exists
        if (class_exists($abstract)) {
            return $this->build($abstract, $parameters);
        }

        throw new Exception("Target class or binding [$abstract] does not exist.");
    }

    /**
     * Build an instance using Reflection for dependency resolution
     */
    public function build(string $concrete, array $parameters = [])
    {
        $reflector = new ReflectionClass($concrete);

        if (!$reflector->isInstantiable()) {
            throw new Exception("Class [$concrete] is not instantiable.");
        }

        $constructor = $reflector->getConstructor();

        if (is_null($constructor)) {
            return new $concrete();
        }

        $dependencies = $this->resolveDependencies($constructor->getParameters(), $parameters);

        return $reflector->newInstanceArgs($dependencies);
    }

    /**
     * Resolve constructor parameter dependencies
     */
    protected function resolveDependencies(array $parameters, array $overrideParams = []): array
    {
        $dependencies = [];

        foreach ($parameters as $parameter) {
            $name = $parameter->getName();

            // Override parameter given explicitly
            if (array_key_exists($name, $overrideParams)) {
                $dependencies[] = $overrideParams[$name];
                continue;
            }

            $type = $parameter->getType();

            if (!$type || !($type instanceof ReflectionNamedType) || $type->isBuiltin()) {
                if ($parameter->isDefaultValueAvailable()) {
                    $dependencies[] = $parameter->getDefaultValue();
                } else {
                    $dependencies[] = null;
                }
                continue;
            }

            $className = $type->getName();

            // Check if bound or instantiable
            try {
                $dependencies[] = $this->make($className);
            } catch (Exception $e) {
                if ($parameter->isDefaultValueAvailable()) {
                    $dependencies[] = $parameter->getDefaultValue();
                } else {
                    throw $e;
                }
            }
        }

        return $dependencies;
    }
}
