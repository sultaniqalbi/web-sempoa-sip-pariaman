<?php

namespace App\Controllers\Guru;

use App\Controllers\BaseController;

class AbsensiController extends BaseController
{
    public function index()
    {
        return $this->view('guru.guru-absensi');
    }
}
