<?php

namespace App\Repositories;

use App\Database\Connection;
use App\Models\BaseModel;

abstract class BaseRepository
{
    protected Connection $connection;
    protected string $table = '';
    protected string $modelClass = BaseModel::class;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function getAll(array $columns = ['*']): array
    {
        $cols = implode(', ', $columns);
        $query = "SELECT {$cols} FROM {$this->table}";
        $results = $this->connection->query($query)->fetchAll();

        if ($this->modelClass && class_exists($this->modelClass)) {
            return array_map(fn($item) => new $this->modelClass($item), $results);
        }

        return $results;
    }

    public function find($id)
    {
        $query = "SELECT * FROM {$this->table} WHERE id = ?";
        $result = $this->connection->query($query, [$id])->fetch();

        if (!$result) {
            return null;
        }

        if ($this->modelClass && class_exists($this->modelClass)) {
            return new $this->modelClass($result);
        }

        return $result;
    }

    public function findBy(string $column, $value)
    {
        $query = "SELECT * FROM {$this->table} WHERE {$column} = ?";
        $result = $this->connection->query($query, [$value])->fetch();

        if (!$result) {
            return null;
        }

        if ($this->modelClass && class_exists($this->modelClass)) {
            return new $this->modelClass($result);
        }

        return $result;
    }

    public function findAllBy(string $column, $value): array
    {
        $query = "SELECT * FROM {$this->table} WHERE {$column} = ?";
        $results = $this->connection->query($query, [$value])->fetchAll();

        if ($this->modelClass && class_exists($this->modelClass)) {
            return array_map(fn($item) => new $this->modelClass($item), $results);
        }

        return $results;
    }

    public function create(array $data)
    {
        $columns = array_keys($data);
        $placeholders = array_fill(0, count($columns), '?');
        $values = array_values($data);

        $cols = implode(', ', $columns);
        $pl = implode(', ', $placeholders);

        $query = "INSERT INTO {$this->table} ({$cols}) VALUES ({$pl})";
        
        $this->connection->query($query, $values);

        $id = $this->connection->getLastInsertId();
        return $this->find($id);
    }

    public function update($id, array $data)
    {
        $columns = array_keys($data);
        $setClauses = array_map(fn($col) => "$col = ?", $columns);
        $values = array_values($data);
        $values[] = $id;

        $setStr = implode(', ', $setClauses);
        $query = "UPDATE {$this->table} SET {$setStr} WHERE id = ?";
        
        $this->connection->query($query, $values);

        return $this->find($id);
    }

    public function delete($id): bool
    {
        $query = "DELETE FROM {$this->table} WHERE id = ?";
        return $this->connection->query($query, [$id]) !== false;
    }

    public function count(string $where = '', array $bindings = []): int
    {
        $query = "SELECT COUNT(*) as count FROM {$this->table}";
        
        if ($where) {
            $query .= " WHERE $where";
        }

        $result = $this->connection->query($query, $bindings)->fetch();
        return (int) ($result['count'] ?? 0);
    }

    public function exists($id): bool
    {
        return !is_null($this->find($id));
    }

    protected function raw(string $query, array $bindings = [])
    {
        return $this->connection->query($query, $bindings);
    }
}
