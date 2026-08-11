<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;

class JadwalController extends BaseController
{
    public function index()
    {
        return $this->view('admin.admin-jadwal');
    }
}
