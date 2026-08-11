<?php

namespace App\Models;

class User extends BaseModel
{
    protected string $table = 'users';

    protected array $casts = [
        'id' => 'int',
        'email' => 'string',
        'role' => 'string',
        'is_active' => 'bool',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected array $hidden = [
        'password',
        'remember_token',
    ];

    public function getFullName(): string
    {
        $role = $this->attributes['role'] ?? 'user';

        if ($role === 'guru') {
            return $this->attributes['nama_guru'] ?? $this->attributes['name'] ?? 'Guru';
        }

        if ($role === 'ortu') {
            return $this->attributes['nama_ortu'] ?? $this->attributes['name'] ?? 'Orang Tua';
        }

        return $this->attributes['name'] ?? 'User';
    }

    public function canManageSiswa(): bool
    {
        return in_array($this->attributes['role'] ?? '', ['admin', 'owner', 'guru']);
    }

    public function canViewFinances(): bool
    {
        return in_array($this->attributes['role'] ?? '', ['admin', 'owner']);
    }

    public function isActive(): bool
    {
        return isset($this->attributes['is_active']) ? (bool) $this->attributes['is_active'] : true;
    }

    public function getRoleDisplayName(): string
    {
        $roles = function_exists('config') ? config('auth.roles') : [];
        $role = $this->attributes['role'] ?? '';
        return $roles[$role] ?? $role;
    }
}
