<?php

namespace App\Repositories;

use App\Models\Siswa;
use App\Database\Connection;

class SiswaRepository extends BaseRepository
{
    protected string $table = 'siswa';
    protected string $modelClass = Siswa::class;

    public function __construct(Connection $connection)
    {
        parent::__construct($connection);
    }

    public function search(string $keyword): array
    {
        $search = "%{$keyword}%";
        $sql = "SELECT * FROM {$this->table} WHERE nama LIKE ? OR nis LIKE ? ORDER BY nama ASC";
        $results = $this->connection->query($sql, [$search, $search])->fetchAll();
        return array_map(fn($data) => new Siswa($data), $results);
    }
}
