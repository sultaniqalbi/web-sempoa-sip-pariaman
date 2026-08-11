<?php

namespace App\Repositories;

use App\Models\Pembayaran;
use App\Database\Connection;

class PembayaranRepository extends BaseRepository
{
    protected string $table = 'pembayaran';
    protected string $modelClass = Pembayaran::class;

    public function __construct(Connection $connection)
    {
        parent::__construct($connection);
    }

    public function getBySiswaId(int $siswaId): array
    {
        return $this->findAllBy('siswa_id', $siswaId);
    }
}
