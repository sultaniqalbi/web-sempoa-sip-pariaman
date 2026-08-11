<?php

namespace App\Controllers\Owner;

use App\Controllers\BaseController;

class KeuanganController extends BaseController
{
    public function index()
    {
        return $this->view('owner.owner-keuangan');
    }
}
