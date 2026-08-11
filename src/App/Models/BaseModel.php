<?php

namespace App\Models;

use DateTime;

abstract class BaseModel
{
    protected array $attributes = [];
    protected array $casts = [];
    protected array $hidden = [];
    protected array $appends = [];

    public function __construct(array $attributes = [])
    {
        $this->attributes = $attributes;
    }

    public function __get(string $name)
    {
        if (array_key_exists($name, $this->attributes)) {
            $value = $this->attributes[$name];

            if (array_key_exists($name, $this->casts)) {
                return $this->castAttribute($name, $value);
            }

            return $value;
        }

        return null;
    }

    public function __set(string $name, $value): void
    {
        $this->attributes[$name] = $value;
    }

    public function __isset(string $name): bool
    {
        return array_key_exists($name, $this->attributes);
    }

    protected function castAttribute(string $name, $value)
    {
        $type = $this->casts[$name];

        if (is_null($value)) {
            return null;
        }

        return match($type) {
            'int', 'integer' => (int) $value,
            'float', 'double' => (float) $value,
            'bool', 'boolean' => (bool) $value,
            'string' => (string) $value,
            'array', 'json' => is_string($value) ? json_decode($value, true) : $value,
            'date', 'datetime' => ($value instanceof DateTime) ? $value : new DateTime($value),
            default => $value,
        };
    }

    public function toArray(): array
    {
        $array = [];

        foreach ($this->attributes as $key => $value) {
            if (in_array($key, $this->hidden)) {
                continue;
            }

            if (array_key_exists($key, $this->casts)) {
                $array[$key] = $this->castAttribute($key, $value);
            } else {
                $array[$key] = $value;
            }
        }

        return $array;
    }

    public function toJson(): string
    {
        return json_encode($this->toArray());
    }

    public function fill(array $attributes): self
    {
        foreach ($attributes as $key => $value) {
            $this->$key = $value;
        }

        return $this;
    }

    public function getAttributes(): array
    {
        return $this->attributes;
    }
}
