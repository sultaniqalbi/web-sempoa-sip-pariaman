<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\SiswaService;
use App\Http\Request;

class SiswaController extends BaseController
{
    private SiswaService $siswaService;

    public function __construct(SiswaService $siswaService, ?Request $request = null)
    {
        parent::__construct($request);
        $this->siswaService = $siswaService;
    }

    public function index()
    {
        $siswaList = $this->siswaService->getAllSiswa();
        return $this->json(['success' => true, 'data' => $siswaList]);
    }

    public function store()
    {
        $data = $this->request->all();
        $siswa = $this->siswaService->createSiswa($data);
        return $this->json(['success' => true, 'data' => $siswa], 201);
    }
}
