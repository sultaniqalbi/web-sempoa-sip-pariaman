<?php

namespace App\Models;

class Siswa extends BaseModel
{
    protected string $table = 'siswa';

    protected array $casts = [
        'id' => 'int',
        'level' => 'int',
        'is_active' => 'bool',
        'created_at' => 'datetime',
    ];
}
