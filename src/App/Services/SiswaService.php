<?php

namespace App\Services;

use App\Repositories\SiswaRepository;
use Monolog\Logger;

class SiswaService extends BaseService
{
    private SiswaRepository $siswaRepository;

    public function __construct(SiswaRepository $siswaRepository, ?Logger $logger = null)
    {
        parent::__construct($logger);
        $this->siswaRepository = $siswaRepository;
    }

    public function getAllSiswa(): array
    {
        return $this->siswaRepository->getAll();
    }

    public function findSiswa($id)
    {
        return $this->siswaRepository->find($id);
    }

    public function createSiswa(array $data)
    {
        return $this->siswaRepository->create($data);
    }

    public function updateSiswa($id, array $data)
    {
        return $this->siswaRepository->update($id, $data);
    }

    public function deleteSiswa($id): bool
    {
        return $this->siswaRepository->delete($id);
    }
}
