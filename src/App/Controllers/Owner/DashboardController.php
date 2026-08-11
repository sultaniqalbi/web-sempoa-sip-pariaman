<?php

namespace App\Controllers\Owner;

use App\Controllers\BaseController;

class DashboardController extends BaseController
{
    public function index()
    {
        return $this->view('owner.portal-owner');
    }
}
