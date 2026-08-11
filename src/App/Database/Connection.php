<?php

namespace App\Database;

use PDO;
use PDOException;
use Exception;

class ConnectionStatement
{
    private \PDOStatement $stmt;

    public function __construct(\PDOStatement $stmt)
    {
        $this->stmt = $stmt;
    }

    public function fetch(int $mode = PDO::FETCH_ASSOC)
    {
        return $this->stmt->fetch($mode);
    }

    public function fetchAll(int $mode = PDO::FETCH_ASSOC): array
    {
        return $this->stmt->fetchAll($mode);
    }

    public function rowCount(): int
    {
        return $this->stmt->rowCount();
    }
}

class Connection
{
    private ?PDO $pdo = null;

    public function __construct(
        string $driver = 'mysql',
        string $host = 'localhost',
        int|string $port = 3306,
        string $database = '',
        string $username = 'root',
        string $password = '',
        array $options = []
    ) {
        $dsn = "{$driver}:host={$host};port={$port};dbname={$database};charset=utf8mb4";
        
        $defaultOptions = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $mergedOptions = array_replace($defaultOptions, $options);

        try {
            $this->pdo = new PDO($dsn, $username, $password, $mergedOptions);
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    public function getPdo(): PDO
    {
        return $this->pdo;
    }

    public function query(string $sql, array $params = []): ConnectionStatement
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return new ConnectionStatement($stmt);
    }

    public function getLastInsertId(): string|false
    {
        return $this->pdo->lastInsertId();
    }

    public function beginTransaction(): bool
    {
        return $this->pdo->beginTransaction();
    }

    public function commit(): bool
    {
        return $this->pdo->commit();
    }

    public function rollBack(): bool
    {
        return $this->pdo->rollBack();
    }
}
