<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\AuthService;
use App\Exceptions\AuthException;
use App\Exceptions\ValidationException;
use App\Http\Request;

class AuthController extends BaseController
{
    private AuthService $authService;

    public function __construct(AuthService $authService, ?Request $request = null)
    {
        parent::__construct($request);
        $this->authService = $authService;
    }

    public function login()
    {
        try {
            $email = $this->request->input('email');
            $password = $this->request->input('password');

            $result = $this->authService->login($email, $password);

            return $this->json($result, 200);

        } catch (ValidationException $e) {
            return $this->json([
                'error' => 'Validation failed',
                'errors' => $e->getErrors()
            ], 422);
        } catch (AuthException $e) {
            return $this->json(['error' => $e->getMessage()], 401);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function register()
    {
        try {
            $data = $this->request->only(['name', 'email', 'password', 'password_confirmation', 'role']);

            $user = $this->authService->register($data);

            return $this->json([
                'success' => true,
                'message' => 'Registrasi berhasil',
                'user' => $user->toArray()
            ], 201);

        } catch (ValidationException $e) {
            return $this->json([
                'error' => 'Validation failed',
                'errors' => $e->getErrors()
            ], 422);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function logout()
    {
        $user = $this->user();
        if ($user) {
            $this->authService->logout($user);
        }

        return $this->json(['success' => true, 'message' => 'Berhasil logout'], 200);
    }
}
