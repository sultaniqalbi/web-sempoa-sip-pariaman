<?php

namespace App\Models;

class Guru extends BaseModel
{
    protected string $table = 'guru';

    protected array $casts = [
        'id' => 'int',
        'is_active' => 'bool',
        'created_at' => 'datetime',
    ];
}
