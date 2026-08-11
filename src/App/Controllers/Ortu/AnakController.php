<?php

namespace App\Controllers\Ortu;

use App\Controllers\BaseController;

class AnakController extends BaseController
{
    public function index()
    {
        return $this->view('ortu.ortu-anak');
    }
}
