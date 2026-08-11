<?php

namespace App\Models;

class Absensi extends BaseModel
{
    protected string $table = 'absensi';

    protected array $casts = [
        'id' => 'int',
        'siswa_id' => 'int',
        'tanggal' => 'date',
        'created_at' => 'datetime',
    ];
}
