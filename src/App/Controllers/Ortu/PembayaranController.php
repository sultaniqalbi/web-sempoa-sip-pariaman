<?php

namespace App\Controllers\Ortu;

use App\Controllers\BaseController;

class PembayaranController extends BaseController
{
    public function index()
    {
        return $this->view('ortu.ortu-pembayaran');
    }
}
