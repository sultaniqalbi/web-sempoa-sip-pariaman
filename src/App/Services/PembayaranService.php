<?php

namespace App\Services;

use App\Repositories\PembayaranRepository;
use Monolog\Logger;

class PembayaranService extends BaseService
{
    private PembayaranRepository $pembayaranRepository;

    public function __construct(PembayaranRepository $pembayaranRepository, ?Logger $logger = null)
    {
        parent::__construct($logger);
        $this->pembayaranRepository = $pembayaranRepository;
    }

    public function getAllPembayaran(): array
    {
        return $this->pembayaranRepository->getAll();
    }

    public function getPembayaranBySiswa(int $siswaId): array
    {
        return $this->pembayaranRepository->getBySiswaId($siswaId);
    }

    public function createPembayaran(array $data)
    {
        return $this->pembayaranRepository->create($data);
    }
}
