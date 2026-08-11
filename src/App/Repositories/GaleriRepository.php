<?php

namespace App\Repositories;

use App\Models\Galeri;
use App\Database\Connection;

class GaleriRepository extends BaseRepository
{
    protected string $table = 'galeri';
    protected string $modelClass = Galeri::class;

    public function __construct(Connection $connection)
    {
        parent::__construct($connection);
    }

    public function getLatest(): array
    {
        $query = "SELECT * FROM {$this->table} ORDER BY created_at DESC";
        $results = $this->connection->query($query)->fetchAll();
        return array_map(fn($item) => new Galeri($item), $results);
    }
}
