<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\GaleriService;
use App\Http\Request;

class GaleriController extends BaseController
{
    private GaleriService $galeriService;

    public function __construct(GaleriService $galeriService, ?Request $request = null)
    {
        parent::__construct($request);
        $this->galeriService = $galeriService;
    }

    public function index()
    {
        $galeri = $this->galeriService->getAllGaleri();
        return $this->json(['success' => true, 'data' => $galeri]);
    }

    public function store()
    {
        $judul = trim($this->request->input('judul', ''));
        if (empty($judul)) {
            return $this->json(['success' => false, 'message' => 'Judul wajib diisi.'], 422);
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            return $this->json(['success' => false, 'message' => 'Gambar wajib diunggah.'], 422);
        }

        $file = $_FILES['image'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (!in_array($ext, $allowedExts)) {
            return $this->json(['success' => false, 'message' => 'Tipe file tidak diizinkan.'], 422);
        }

        $uploadDir = (defined('PUBLIC_PATH') ? PUBLIC_PATH : APP_ROOT . '/public') . '/storage/uploads/galeri/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $newFileName = uniqid('gal_') . '.' . $ext;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $imagePath = 'storage/uploads/galeri/' . $newFileName;
            $galeri = $this->galeriService->createGaleri([
                'judul' => $judul,
                'image_path' => $imagePath,
                'created_at' => date('Y-m-d H:i:s')
            ]);

            return $this->json(['success' => true, 'message' => 'Galeri berhasil ditambahkan.', 'data' => $galeri], 201);
        }

        return $this->json(['success' => false, 'message' => 'Gagal mengunggah gambar.'], 500);
    }

    public function destroy($id)
    {
        $deleted = $this->galeriService->deleteGaleri($id);
        if ($deleted) {
            return $this->json(['success' => true, 'message' => 'Galeri berhasil dihapus.']);
        }
        return $this->json(['success' => false, 'message' => 'Gagal menghapus galeri.'], 400);
    }
}
