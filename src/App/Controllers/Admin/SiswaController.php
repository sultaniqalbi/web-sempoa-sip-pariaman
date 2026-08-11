<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Services\SiswaService;

class SiswaController extends BaseController
{
    private SiswaService $siswaService;

    public function __construct(SiswaService $siswaService)
    {
        parent::__construct();
        $this->siswaService = $siswaService;
    }

    public function index()
    {
        $siswaList = $this->siswaService->getAllSiswa();
        return $this->view('admin.admin-siswa', ['siswaList' => $siswaList]);
    }
}
