<?php

namespace App\Controllers\Guru;

use App\Controllers\BaseController;

class DashboardController extends BaseController
{
    public function index()
    {
        return $this->view('guru.guru-dashboard');
    }
}
