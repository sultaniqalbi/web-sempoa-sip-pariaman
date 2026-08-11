<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use App\Helpers\HashHelper;
use App\Helpers\TokenHelper;
use App\Exceptions\AuthException;
use App\Exceptions\ValidationException;
use Monolog\Logger;

class AuthService extends BaseService
{
    private UserRepository $userRepository;
    private HashHelper $hash;
    private TokenHelper $tokenHelper;
    private array $config;

    public function __construct(
        UserRepository $userRepository,
        ?HashHelper $hash = null,
        ?TokenHelper $tokenHelper = null,
        ?Logger $logger = null
    ) {
        parent::__construct($logger);
        
        $this->userRepository = $userRepository;
        $this->hash = $hash ?? new HashHelper();
        $this->tokenHelper = $tokenHelper ?? new TokenHelper();
        $this->config = function_exists('config') ? config('auth') : [];
    }

    public function login(string $email, string $password): array
    {
        if (empty($email) || empty($password)) {
            throw new ValidationException(['auth' => 'Email dan password harus diisi']);
        }

        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            $this->logWarning('Login attempt dengan email tidak terdaftar', ['email' => $email]);
            throw new AuthException('Email atau password salah');
        }

        if (!$user->isActive()) {
            $this->logWarning('Login attempt untuk user yang tidak aktif', ['user_id' => $user->id]);
            throw new AuthException('Akun Anda telah dinonaktifkan');
        }

        if (!$this->hash->verify($password, $user->password ?? '')) {
            $this->logWarning('Login attempt dengan password salah', ['email' => $email]);
            $this->incrementLoginAttempts($email);
            throw new AuthException('Email atau password salah');
        }

        $this->resetLoginAttempts($email);
        $token = $this->tokenHelper->generate($user);

        $this->logInfo('User berhasil login', [
            'user_id' => $user->id,
            'email' => $email,
            'role' => $user->role,
        ]);

        return [
            'success' => true,
            'user' => $user->toArray(),
            'token' => $token,
            'expires_in' => $this->config['token']['expires_in'] ?? 3600,
        ];
    }

    public function register(array $data): User
    {
        $this->validateRegistration($data);

        if ($this->userRepository->emailExists($data['email'])) {
            throw new ValidationException(['email' => 'Email sudah terdaftar']);
        }

        $data['password'] = $this->hash->make($data['password']);
        $data['role'] = $data['role'] ?? 'ortu';
        $data['is_active'] = 1;
        $data['created_at'] = date('Y-m-d H:i:s');

        unset($data['password_confirmation']);

        $user = $this->userRepository->create($data);

        $this->logInfo('User baru berhasil didaftarkan', [
            'user_id' => $user->id,
            'email' => $data['email'],
            'role' => $data['role'],
        ]);

        return $user;
    }

    public function logout($user): bool
    {
        if (is_object($user) && isset($user->id)) {
            $this->logInfo('User logout', ['user_id' => $user->id]);
        }
        
        if (session_status() === PHP_SESSION_ACTIVE) {
            unset($_SESSION['user']);
        }
        
        return true;
    }

    public function updatePassword(User $user, string $currentPassword, string $newPassword): bool
    {
        if (!$this->hash->verify($currentPassword, $user->password ?? '')) {
            throw new AuthException('Password saat ini tidak sesuai');
        }

        $minLength = $this->config['password']['min_length'] ?? 6;
        if (strlen($newPassword) < $minLength) {
            throw new ValidationException([
                'password' => 'Password minimal ' . $minLength . ' karakter'
            ]);
        }

        $hashedPassword = $this->hash->make($newPassword);
        $this->userRepository->update($user->id, ['password' => $hashedPassword]);

        $this->logInfo('User mengubah password', ['user_id' => $user->id]);

        return true;
    }

    private function validateRegistration(array $data): void
    {
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException(['email' => 'Email tidak valid']);
        }

        $minLength = $this->config['password']['min_length'] ?? 6;
        if (empty($data['password']) || strlen($data['password']) < $minLength) {
            throw new ValidationException([
                'password' => 'Password minimal ' . $minLength . ' karakter'
            ]);
        }

        if (isset($data['password_confirmation']) && $data['password'] !== $data['password_confirmation']) {
            throw new ValidationException(['password' => 'Konfirmasi password tidak sesuai']);
        }
    }

    private function incrementLoginAttempts(string $email): void
    {
        $key = "login_attempts:{$email}";
        $attempts = (int) ($_SESSION[$key] ?? 0);
        $_SESSION[$key] = $attempts + 1;
    }

    private function resetLoginAttempts(string $email): void
    {
        $key = "login_attempts:{$email}";
        unset($_SESSION[$key]);
    }
}
