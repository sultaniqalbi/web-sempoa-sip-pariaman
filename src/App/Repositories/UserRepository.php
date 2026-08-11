<?php

namespace App\Repositories;

use App\Models\User;
use App\Database\Connection;

class UserRepository extends BaseRepository
{
    protected string $table = 'users';
    protected string $modelClass = User::class;

    public function __construct(Connection $connection)
    {
        parent::__construct($connection);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->findBy('email', $email);
    }

    public function findByRole(string $role): array
    {
        return $this->findAllBy('role', $role);
    }

    public function getActive(): array
    {
        $query = "SELECT * FROM {$this->table} WHERE is_active = 1 ORDER BY created_at DESC";
        $results = $this->connection->query($query)->fetchAll();
        
        return array_map(fn($data) => new User($data), $results);
    }

    public function search(string $query): array
    {
        $search = "%{$query}%";
        $sql = "SELECT * FROM {$this->table} 
                WHERE email LIKE ? OR name LIKE ? 
                ORDER BY created_at DESC";
        
        $results = $this->connection->query($sql, [$search, $search])->fetchAll();
        
        return array_map(fn($data) => new User($data), $results);
    }

    public function getByRoleWithPagination(string $role, int $page = 1, int $perPage = 15): array
    {
        $offset = ($page - 1) * $perPage;
        
        $query = "SELECT * FROM {$this->table} 
                  WHERE role = ? 
                  ORDER BY created_at DESC 
                  LIMIT ? OFFSET ?";
        
        $results = $this->connection->query($query, [$role, $perPage, $offset])->fetchAll();
        $total = $this->count('role = ?', [$role]);
        
        return [
            'data' => array_map(fn($data) => new User($data), $results),
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage),
        ];
    }

    public function emailExists(string $email): bool
    {
        return !is_null($this->findByEmail($email));
    }

    public function deactivate($id): bool
    {
        return (bool) $this->update($id, ['is_active' => false]);
    }

    public function activate($id): bool
    {
        return (bool) $this->update($id, ['is_active' => true]);
    }
}
