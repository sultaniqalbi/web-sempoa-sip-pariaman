<?php

namespace App\Http;

use Exception;

class Response
{
    protected int $statusCode = 200;
    protected array $headers = [];

    public function status(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function header(string $key, string $value): self
    {
        $this->headers[$key] = $value;
        return $this;
    }

    public function json(array $data, int $statusCode = 200): string
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');

        foreach ($this->headers as $key => $value) {
            header("$key: $value");
        }

        return json_encode($data);
    }

    public function view(string $view, array $data = []): string
    {
        http_response_code($this->statusCode);

        foreach ($this->headers as $key => $value) {
            header("$key: $value");
        }

        $basePath = (defined('SRC_PATH') ? SRC_PATH : __DIR__ . '/../..') . '/Views/' . str_replace('.', '/', $view);
        $viewPath = $basePath . '.php';

        if (!file_exists($viewPath)) {
            if (file_exists($basePath . '.html')) {
                $viewPath = $basePath . '.html';
            } else {
                throw new Exception("View not found: $viewPath");
            }
        }

        extract($data);

        ob_start();
        include $viewPath;
        return ob_get_clean();
    }

    public function redirect(string $url, int $code = 302): void
    {
        http_response_code($code);
        header("Location: $url");
        exit;
    }

    public function download(string $filePath, ?string $name = null): void
    {
        if (!file_exists($filePath)) {
            throw new Exception("File not found: $filePath");
        }

        $name = $name ?? basename($filePath);

        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $name . '"');
        header('Content-Length: ' . filesize($filePath));

        readfile($filePath);
        exit;
    }

    public function file(string $filePath, string $mimeType = 'application/octet-stream'): void
    {
        if (!file_exists($filePath)) {
            throw new Exception("File not found: $filePath");
        }

        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filePath));

        readfile($filePath);
        exit;
    }
}
