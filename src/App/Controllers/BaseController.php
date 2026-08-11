<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;

abstract class BaseController
{
    protected Request $request;
    protected Response $response;

    public function __construct(Request $request = null, Response $response = null)
    {
        $this->request = $request ?? new Request();
        $this->response = $response ?? new Response();
    }

    protected function view(string $view, array $data = [])
    {
        return $this->response->view($view, $data);
    }

    protected function json(array $data, int $statusCode = 200)
    {
        return $this->response->json($data, $statusCode);
    }

    protected function redirect(string $url, int $statusCode = 302)
    {
        return $this->response->redirect($url, $statusCode);
    }

    protected function user()
    {
        return $this->request->user();
    }

    protected function authorize(string $ability, $resource = null): bool
    {
        $user = $this->user();
        if (!$user) return false;

        if ($ability === 'view' && isset($user['role']) && $user['role'] === 'ortu') {
            return true;
        }

        if ($ability === 'manage' && isset($user['role']) && in_array($user['role'], ['admin', 'owner'])) {
            return true;
        }

        return false;
    }

    protected function abort(int $code, string $message = ''): void
    {
        throw new \App\Exceptions\HttpException($code, $message);
    }
}
