<?php

namespace App\Services;

use App\Repositories\GaleriRepository;
use Monolog\Logger;

class GaleriService extends BaseService
{
    private GaleriRepository $galeriRepository;

    public function __construct(GaleriRepository $galeriRepository, ?Logger $logger = null)
    {
        parent::__construct($logger);
        $this->galeriRepository = $galeriRepository;
    }

    public function getAllGaleri(): array
    {
        return $this->galeriRepository->getLatest();
    }

    public function findGaleri($id)
    {
        return $this->galeriRepository->find($id);
    }

    public function createGaleri(array $data)
    {
        return $this->galeriRepository->create($data);
    }

    public function updateGaleri($id, array $data)
    {
        return $this->galeriRepository->update($id, $data);
    }

    public function deleteGaleri($id): bool
    {
        $galeri = $this->galeriRepository->find($id);
        if ($galeri && !empty($galeri->image_path)) {
            $filePath = defined('APP_ROOT') ? APP_ROOT . '/' . $galeri->image_path : __DIR__ . '/../../../' . $galeri->image_path;
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }
        return $this->galeriRepository->delete($id);
    }
}
