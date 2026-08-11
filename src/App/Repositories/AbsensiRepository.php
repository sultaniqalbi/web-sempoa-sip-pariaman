<?php

namespace App\Repositories;

use App\Models\Absensi;
use App\Database\Connection;

class AbsensiRepository extends BaseRepository
{
    protected string $table = 'absensi';
    protected string $modelClass = Absensi::class;

    public function __construct(Connection $connection)
    {
        parent::__construct($connection);
    }

    public function getByDate(string $date): array
    {
        $query = "SELECT * FROM {$this->table} WHERE DATE(tanggal) = ?";
        $results = $this->connection->query($query, [$date])->fetchAll();
        return array_map(fn($item) => new Absensi($item), $results);
    }

    public function logGuruTap(string $uid, string $nama, string $waktu, string $mode = 'ONLINE'): bool
    {
        $query = "INSERT INTO absensi_log (uid, nama, waktu, mode) VALUES (?, ?, ?, ?)";
        return $this->connection->query($query, [$uid, $nama, $waktu, $mode]) !== false;
    }

    public function checkGuruTappedToday(string $uid, string $date): bool
    {
        $query = "SELECT id FROM absensi_log WHERE uid = ? AND DATE(waktu) = ?";
        $res = $this->connection->query($query, [$uid, $date])->fetchAll();
        return count($res) > 0;
    }
}
