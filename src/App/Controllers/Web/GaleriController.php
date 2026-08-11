<?php

namespace App\Controllers\Web;

use App\Controllers\BaseController;
use App\Services\GaleriService;

class GaleriController extends BaseController
{
    private GaleriService $galeriService;

    public function __construct(GaleriService $galeriService)
    {
        parent::__construct();
        $this->galeriService = $galeriService;
    }

    public function index()
    {
        $galeriList = $this->galeriService->getAllGaleri();
        return $this->view('pages.galeri', ['galeriList' => $galeriList]);
    }
}
