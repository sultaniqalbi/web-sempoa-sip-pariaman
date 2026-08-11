<?php

namespace App\Models;

class Pembayaran extends BaseModel
{
    protected string $table = 'pembayaran';

    protected array $casts = [
        'id' => 'int',
        'siswa_id' => 'int',
        'jumlah' => 'float',
        'created_at' => 'datetime',
    ];
}
