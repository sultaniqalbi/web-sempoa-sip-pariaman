<?php

namespace App\Middleware;

use App\Exceptions\AuthException;
use App\Helpers\TokenHelper;
use App\Http\Request;

class AuthMiddleware
{
    private TokenHelper $tokenHelper;

    public function __construct(?TokenHelper $tokenHelper = null)
    {
        $this->tokenHelper = $tokenHelper ?? new TokenHelper();
    }

    public function handle(Request $request): bool
    {
        if (isset($_SESSION['user']) && !empty($_SESSION['user'])) {
            return true;
        }

        $token = $request->bearerToken();
        
        if ($token) {
            try {
                $payload = $this->tokenHelper->verify($token);
                $_SESSION['user'] = $payload;
                $request->setUser($payload);
                return true;
            } catch (\Exception $e) {
                throw new AuthException('Token tidak valid atau telah kedaluwarsa');
            }
        }

        throw new AuthException('Autentikasi diperlukan');
    }
}
