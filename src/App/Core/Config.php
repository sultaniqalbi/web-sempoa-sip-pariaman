<?php

namespace App\Core;

class Config
{
    private static array $config = [];

    /**
     * Load config file
     */
    public static function load(string $file): array
    {
        $name = pathinfo($file, PATHINFO_FILENAME);
        if (file_exists($file)) {
            self::$config[$name] = require $file;
        }
        return self::$config[$name] ?? [];
    }

    /**
     * Get config value using dot notation (e.g. app.name)
     */
    public static function get(string $key, $default = null)
    {
        $parts = explode('.', $key);
        $file = array_shift($parts);

        if (!isset(self::$config[$file])) {
            $path = defined('APP_ROOT') ? APP_ROOT . "/src/config/{$file}.php" : __DIR__ . "/../../config/{$file}.php";
            if (file_exists($path)) {
                self::$config[$file] = require $path;
            } else {
                return $default;
            }
        }

        $current = self::$config[$file];

        foreach ($parts as $part) {
            if (is_array($current) && array_key_exists($part, $current)) {
                $current = $current[$part];
            } else {
                return $default;
            }
        }

        return $current;
    }
}
