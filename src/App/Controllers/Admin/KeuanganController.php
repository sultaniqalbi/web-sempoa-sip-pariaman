<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;

class KeuanganController extends BaseController
{
    public function index()
    {
        return $this->view('admin.admin-keuangan');
    }
}
