<?php

namespace App\Repositories;

use App\Models\Jadwal;
use App\Database\Connection;

class JadwalRepository extends BaseRepository
{
    protected string $table = 'jadwal';
    protected string $modelClass = Jadwal::class;

    public function __construct(Connection $connection)
    {
        parent::__construct($connection);
    }

    public function getByHari(string $hari): array
    {
        return $this->findAllBy('hari', $hari);
    }
}
