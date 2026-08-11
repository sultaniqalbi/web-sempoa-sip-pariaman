<?php

namespace App\Controllers\Owner;

use App\Controllers\BaseController;

class JadwalController extends BaseController
{
    public function index()
    {
        return $this->view('owner.owner-jadwal');
    }
}
