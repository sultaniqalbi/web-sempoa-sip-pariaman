<?php

namespace App\Models;

class Jadwal extends BaseModel
{
    protected string $table = 'jadwal';

    protected array $casts = [
        'id' => 'int',
        'guru_id' => 'int',
        'created_at' => 'datetime',
    ];
}
