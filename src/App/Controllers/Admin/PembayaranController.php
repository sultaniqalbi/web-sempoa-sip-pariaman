<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;

class PembayaranController extends BaseController
{
    public function index()
    {
        return $this->view('admin.admin-pembayaran');
    }
}
