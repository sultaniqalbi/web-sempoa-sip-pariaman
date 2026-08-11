<?php

namespace App\Controllers\Owner;

use App\Controllers\BaseController;

class RiwayatController extends BaseController
{
    public function index()
    {
        return $this->view('owner.owner-riwayat');
    }
}
