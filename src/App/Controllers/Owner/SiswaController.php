<?php

namespace App\Controllers\Owner;

use App\Controllers\BaseController;

class SiswaController extends BaseController
{
    public function index()
    {
        return $this->view('owner.owner-siswa');
    }
}
