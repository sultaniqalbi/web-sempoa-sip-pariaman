<?php

namespace App\Middleware;

use App\Exceptions\PermissionException;
use App\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, ...$roles): bool
    {
        $user = $request->user();

        if (!$user) {
            throw new PermissionException('Akses ditolak: pengguna belum login');
        }

        $userRole = is_object($user) ? $user->role : ($user['role'] ?? '');

        if (empty($roles)) {
            return true;
        }

        // Handle roles passed as comma-separated strings or arrays
        $allowedRoles = [];
        foreach ($roles as $r) {
            if (is_string($r)) {
                $allowedRoles = array_merge($allowedRoles, array_map('trim', explode(',', $r)));
            } elseif (is_array($r)) {
                $allowedRoles = array_merge($allowedRoles, $r);
            }
        }

        if (in_array($userRole, $allowedRoles)) {
            return true;
        }

        throw new PermissionException('Akses ditolak: Anda tidak memiliki izin untuk mengakses halaman ini');
    }
}
