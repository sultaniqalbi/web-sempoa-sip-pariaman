<?php

namespace App\Models;

class Galeri extends BaseModel
{
    protected string $table = 'galeri';

    protected array $casts = [
        'id' => 'int',
        'created_at' => 'datetime',
    ];
}
