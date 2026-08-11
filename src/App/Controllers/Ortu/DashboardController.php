<?php

namespace App\Controllers\Ortu;

use App\Controllers\BaseController;

class DashboardController extends BaseController
{
    public function index()
    {
        return $this->view('ortu.ortu-dashboard');
    }
}
