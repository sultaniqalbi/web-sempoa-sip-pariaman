<?php

namespace App\Controllers\Owner;

use App\Controllers\BaseController;

class GuruController extends BaseController
{
    public function index()
    {
        return $this->view('owner.owner-guru');
    }
}
