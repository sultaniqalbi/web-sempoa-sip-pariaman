<?php

namespace App\Services;

use App\Repositories\GuruRepository;
use Monolog\Logger;

class GuruService extends BaseService
{
    private GuruRepository $guruRepository;

    public function __construct(GuruRepository $guruRepository, ?Logger $logger = null)
    {
        parent::__construct($logger);
        $this->guruRepository = $guruRepository;
    }

    public function getAllGuru(): array
    {
        return $this->guruRepository->getAll();
    }

    public function findGuru($id)
    {
        return $this->guruRepository->find($id);
    }

    public function findGuruByUid(string $uid)
    {
        return $this->guruRepository->findByUid($uid);
    }

    public function createGuru(array $data)
    {
        return $this->guruRepository->create($data);
    }

    public function updateGuru($id, array $data)
    {
        return $this->guruRepository->update($id, $data);
    }

    public function deleteGuru($id): bool
    {
        return $this->guruRepository->delete($id);
    }
}
