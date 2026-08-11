<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Services\AbsensiService;

class AbsensiController extends BaseController
{
    private AbsensiService $absensiService;

    public function __construct(AbsensiService $absensiService)
    {
        parent::__construct();
        $this->absensiService = $absensiService;
    }

    public function index()
    {
        return $this->view('admin.admin-absensi-guru');
    }
}
