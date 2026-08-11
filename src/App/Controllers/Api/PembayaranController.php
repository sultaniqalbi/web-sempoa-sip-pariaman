<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\PembayaranService;
use App\Http\Request;

class PembayaranController extends BaseController
{
    private PembayaranService $pembayaranService;

    public function __construct(PembayaranService $pembayaranService, ?Request $request = null)
    {
        parent::__construct($request);
        $this->pembayaranService = $pembayaranService;
    }

    public function index()
    {
        $list = $this->pembayaranService->getAllPembayaran();
        return $this->json(['success' => true, 'data' => $list]);
    }

    public function store()
    {
        $data = $this->request->all();
        $record = $this->pembayaranService->createPembayaran($data);
        return $this->json(['success' => true, 'data' => $record], 201);
    }
}
