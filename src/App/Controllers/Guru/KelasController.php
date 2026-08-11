<?php

namespace App\Controllers\Guru;

use App\Controllers\BaseController;

class KelasController extends BaseController
{
    public function index()
    {
        return $this->view('guru.guru-kelas');
    }
}
