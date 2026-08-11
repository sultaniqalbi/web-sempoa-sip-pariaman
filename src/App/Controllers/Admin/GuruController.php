<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Services\GuruService;

class GuruController extends BaseController
{
    private GuruService $guruService;

    public function __construct(GuruService $guruService)
    {
        parent::__construct();
        $this->guruService = $guruService;
    }

    public function index()
    {
        $guruList = $this->guruService->getAllGuru();
        return $this->view('admin.admin-guru', ['guruList' => $guruList]);
    }
}
