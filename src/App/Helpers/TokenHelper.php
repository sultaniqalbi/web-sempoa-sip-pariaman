<?php

namespace App\Helpers;

use App\Models\User;
use Exception;

class TokenHelper
{
    private string $secret;
    private int $expiresIn;

    public function __construct(?string $secret = null, int $expiresIn = 3600)
    {
        $this->secret = $secret ?? (function_exists('config') ? config('auth.token.secret', 'secret_key_sempoa') : 'secret_key_sempoa');
        $this->expiresIn = $expiresIn;
    }

    public function generate($user): string
    {
        $payload = [
            'sub' => is_object($user) ? $user->id : ($user['id'] ?? null),
            'email' => is_object($user) ? $user->email : ($user['email'] ?? null),
            'role' => is_object($user) ? $user->role : ($user['role'] ?? null),
            'iat' => time(),
            'exp' => time() + $this->expiresIn,
        ];

        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        
        $base64UrlHeader = $this->base64UrlEncode(json_encode($header));
        $base64UrlPayload = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret, true);
        $base64UrlSignature = $this->base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public function verify(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception("Invalid token format");
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

        $signature = $this->base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret, true);

        if (!hash_equals($signature, $expectedSignature)) {
            throw new Exception("Invalid token signature");
        }

        $payload = json_decode($this->base64UrlDecode($base64UrlPayload), true);

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception("Token expired");
        }

        return $payload;
    }

    public function generateResetToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }
}
