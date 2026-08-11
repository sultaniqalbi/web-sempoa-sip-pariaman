<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;

class GaleriController extends BaseController
{
    public function index()
    {
        return $this->view('admin.admin-galeri');
    }
}
