<?php

namespace App\Controllers\Auth;

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

    public function loginForm()
    {
        if (is_authenticated()) {
            $user = auth();
            $role = is_object($user) ? $user->role : ($user['role'] ?? '');
            return $this->redirectByRole($role);
        }
        return $this->view('auth.login');
    }

    public function login(Request $request)
    {
        if ($request->method() !== 'POST') {
            return $this->redirect('/login');
        }

        try {
            $email = $request->input('email');
            $password = $request->input('password');

            $result = $this->authService->login($email, $password);

            $_SESSION['user'] = $result['user'];
            $role = $result['user']['role'] ?? 'ortu';

            return $this->redirectByRole($role);

        } catch (ValidationException $e) {
            set_flash('errors', $e->getErrors());
            return $this->redirect('/login');
        } catch (AuthException $e) {
            set_flash('error', $e->getMessage());
            return $this->redirect('/login');
        }
    }

    public function logout(Request $request)
    {
        $user = $this->user();
        
        if ($user) {
            $this->authService->logout($user);
        }

        set_flash('success', 'Anda berhasil logout');
        return $this->redirect('/login');
    }

    public function registerForm()
    {
        return $this->view('auth.register');
    }

    public function register(Request $request)
    {
        if ($request->method() !== 'POST') {
            return $this->redirect('/register');
        }

        try {
            $data = $request->only(['name', 'email', 'password', 'password_confirmation']);

            $user = $this->authService->register($data);

            set_flash('success', 'Pendaftaran berhasil! Silakan login.');
            return $this->redirect('/login');

        } catch (ValidationException $e) {
            set_flash('errors', $e->getErrors());
            return $this->redirect('/register');
        }
    }

    private function redirectByRole(string $role)
    {
        $redirects = [
            'admin' => '/admin/dashboard',
            'owner' => '/owner/dashboard',
            'guru' => '/guru/dashboard',
            'ortu' => '/ortu/dashboard',
        ];

        return $this->redirect($redirects[$role] ?? '/');
    }
}
