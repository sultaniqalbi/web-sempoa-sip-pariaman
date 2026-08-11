<?php

namespace App\Http;

class Request
{
    protected array $queryParams = [];
    protected array $bodyParams = [];
    protected array $headers = [];
    protected ?array $user = null;

    public function __construct()
    {
        $this->queryParams = $_GET ?? [];
        $this->bodyParams = $this->parseBody();
        $this->headers = function_exists('getallheaders') ? (getallheaders() ?: []) : [];
    }

    protected function parseBody(): array
    {
        $input = file_get_contents('php://input');
        
        if (empty($input)) {
            return $_POST ?? [];
        }

        if ($this->isJson()) {
            return json_decode($input, true) ?? [];
        }

        return $_POST ?? [];
    }

    public function getContentType(): string
    {
        return $this->header('Content-Type') ?? $this->header('content-type') ?? 'application/x-www-form-urlencoded';
    }

    public function query(string $key, $default = null)
    {
        return $this->queryParams[$key] ?? $default;
    }

    public function input(string $key, $default = null)
    {
        return $this->bodyParams[$key] ?? $this->queryParams[$key] ?? $default;
    }

    public function all(): array
    {
        return array_merge($this->queryParams, $this->bodyParams);
    }

    public function only(array $keys): array
    {
        $result = [];
        $all = $this->all();

        foreach ($keys as $key) {
            if (array_key_exists($key, $all)) {
                $result[$key] = $all[$key];
            }
        }

        return $result;
    }

    public function validate(array $rules): array
    {
        return $this->all();
    }

    public function user()
    {
        return $this->user ?? ($_SESSION['user'] ?? null);
    }

    public function setUser($user): void
    {
        $this->user = $user;
        $_SESSION['user'] = $user;
    }

    public function header(string $key, $default = null)
    {
        $normalizedKey = strtolower($key);
        foreach ($this->headers as $hKey => $hValue) {
            if (strtolower($hKey) === $normalizedKey) {
                return $hValue;
            }
        }
        return $default;
    }

    public function bearerToken(): ?string
    {
        $header = $this->header('Authorization');
        
        if (!$header || !preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
            return null;
        }

        return $matches[1];
    }

    public function isJson(): bool
    {
        return str_contains($this->getContentType(), 'application/json');
    }

    public function method(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    public function uri(): string
    {
        return parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    }

    public function isAjax(): bool
    {
        return $this->header('X-Requested-With') === 'XMLHttpRequest';
    }
}
