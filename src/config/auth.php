<?php

return [
    'driver' => env('AUTH_DRIVER', 'session'),
    'session' => [
        'name' => 'sempoa_session',
        'lifetime' => (int) env('SESSION_LIFETIME', 120),
        'secure' => (bool) env('SESSION_SECURE', false),
        'http_only' => (bool) env('SESSION_HTTP_ONLY', true),
    ],
    'token' => [
        'secret' => env('JWT_SECRET', 'secret_key_sempoa'),
        'expires_in' => (int) env('JWT_EXPIRES_IN', 3600),
        'algorithm' => 'HS256',
    ],
    'hash' => [
        'algorithm' => env('HASH_ALGORITHM', 'bcrypt'),
        'bcrypt_rounds' => (int) env('BCRYPT_ROUNDS', 12),
    ],
    'password' => [
        'min_length' => 6,
        'require_uppercase' => false,
        'require_numbers' => false,
        'require_special_chars' => false,
    ],
    'login_attempts' => [
        'max_attempts' => 5,
        'lockout_time' => 15,
    ],
    'roles' => [
        'admin' => 'Administrator',
        'owner' => 'Pemilik (Owner)',
        'guru' => 'Guru/Pengajar',
        'ortu' => 'Orang Tua/Wali',
    ],
];
