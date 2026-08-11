<?php

namespace App\Repositories;

use App\Models\Guru;
use App\Database\Connection;

class GuruRepository extends BaseRepository
{
    protected string $table = 'guru';
    protected string $modelClass = Guru::class;

    public function __construct(Connection $connection)
    {
        parent::__construct($connection);
    }

    public function findByUid(string $uid): ?Guru
    {
        $query = "SELECT * FROM {$this->table} WHERE UPPER(uid) = ?";
        $result = $this->connection->query($query, [strtoupper($uid)])->fetch();
        return $result ? new Guru($result) : null;
    }
}
