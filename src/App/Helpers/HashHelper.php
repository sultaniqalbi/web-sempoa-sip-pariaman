<?php

namespace App\Helpers;

class HashHelper
{
    private int $rounds;

    public function __construct(int $rounds = 12)
    {
        $this->rounds = $rounds;
    }

    public function make(string $value): string
    {
        return password_hash($value, PASSWORD_BCRYPT, ['cost' => $this->rounds]);
    }

    public function verify(string $value, string $hashedValue): bool
    {
        if (empty($hashedValue)) {
            return false;
        }
        return password_verify($value, $hashedValue);
    }

    public function needsRehash(string $hashedValue): bool
    {
        return password_needs_rehash($hashedValue, PASSWORD_BCRYPT, ['cost' => $this->rounds]);
    }
}
