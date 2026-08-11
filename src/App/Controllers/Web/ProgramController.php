<?php

namespace App\Controllers\Web;

use App\Controllers\BaseController;

class ProgramController extends BaseController
{
    public function show(string $slug = 'sempoa')
    {
        $template = match($slug) {
            'fonem' => 'pages.program-fonem',
            'inggris' => 'pages.program-inggris',
            'tahfidz' => 'pages.program-tahfidz',
            default => 'pages.program-sempoa',
        };

        return $this->view($template);
    }
}
