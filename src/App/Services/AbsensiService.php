<?php

namespace App\Services;

use App\Repositories\AbsensiRepository;
use App\Repositories\GuruRepository;
use Monolog\Logger;

class AbsensiService extends BaseService
{
    private AbsensiRepository $absensiRepository;
    private GuruRepository $guruRepository;

    public function __construct(
        AbsensiRepository $absensiRepository,
        GuruRepository $guruRepository,
        ?Logger $logger = null
    ) {
        parent::__construct($logger);
        $this->absensiRepository = $absensiRepository;
        $this->guruRepository = $guruRepository;
    }

    public function getAbsensiByDate(string $date): array
    {
        return $this->absensiRepository->getByDate($date);
    }

    public function recordAttendance(array $data)
    {
        return $this->absensiRepository->create($data);
    }

    public function processRfidTap(string $uid, string $mode = 'ONLINE'): array
    {
        $uid = strtoupper(trim($uid));
        if (empty($uid)) {
            return ['status' => 'ERROR', 'message' => 'ERROR_UID_KOSONG'];
        }

        $guru = $this->guruRepository->findByUid($uid);
        $lastTapFile = defined('STORAGE_PATH') ? STORAGE_PATH . '/logs/last_tap.json' : APP_ROOT . '/storage/logs/last_tap.json';

        if (!$guru) {
            $tapData = [
                'uid' => $uid,
                'waktu' => date('Y-m-d H:i:s'),
                'status' => 'UNREGISTERED'
            ];
            @file_put_contents($lastTapFile, json_encode($tapData));
            return ['status' => 'UNREGISTERED', 'message' => 'TIDAK_TERDAFTAR'];
        }

        $namaGuru = $guru->nama ?? 'Guru';
        $hariIni = date('Y-m-d');

        $tapData = [
            'uid' => $uid,
            'waktu' => date('Y-m-d H:i:s'),
            'status' => 'REGISTERED',
            'nama' => $namaGuru
        ];
        @file_put_contents($lastTapFile, json_encode($tapData));

        if ($this->absensiRepository->checkGuruTappedToday($uid, $hariIni)) {
            return ['status' => 'OK', 'nama' => $namaGuru, 'sub_status' => 'SUDAH_TAP'];
        }

        $waktu = date('Y-m-d H:i:s');
        $success = $this->absensiRepository->logGuruTap($uid, $namaGuru, $waktu, $mode);

        if ($success) {
            return ['status' => 'OK', 'nama' => $namaGuru, 'sub_status' => 'SUCCESS'];
        }

        return ['status' => 'ERROR', 'message' => 'ERROR_DB'];
    }
}
