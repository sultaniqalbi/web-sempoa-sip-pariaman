<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;

class RiwayatController extends BaseController
{
    public function index()
    {
        return $this->view('admin.admin-riwayat');
    }
}
