<?php

namespace App\Services;

use App\Repositories\JadwalRepository;
use Monolog\Logger;

class JadwalService extends BaseService
{
    private JadwalRepository $jadwalRepository;

    public function __construct(JadwalRepository $jadwalRepository, ?Logger $logger = null)
    {
        parent::__construct($logger);
        $this->jadwalRepository = $jadwalRepository;
    }

    public function getAllJadwal(): array
    {
        return $this->jadwalRepository->getAll();
    }

    public function createJadwal(array $data)
    {
        return $this->jadwalRepository->create($data);
    }
}
