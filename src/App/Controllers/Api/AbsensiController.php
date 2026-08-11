<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\AbsensiService;
use App\Http\Request;

class AbsensiController extends BaseController
{
    private AbsensiService $absensiService;

    public function __construct(AbsensiService $absensiService, ?Request $request = null)
    {
        parent::__construct($request);
        $this->absensiService = $absensiService;
    }

    public function index()
    {
        $date = $this->request->query('date', date('Y-m-d'));
        $data = $this->absensiService->getAbsensiByDate($date);
        return $this->json(['success' => true, 'data' => $data]);
    }

    public function store()
    {
        $data = $this->request->all();
        $record = $this->absensiService->recordAttendance($data);
        return $this->json(['success' => true, 'data' => $record], 201);
    }

    public function rfidTap()
    {
        $apiKeyHeader = $_SERVER['HTTP_X_API_KEY'] ?? $_SERVER['X_API_KEY'] ?? '';
        $expectedKey = env('ESP32_API_KEY', 'SempoaPariaman_ESP32_SecureKey_2026!');
        if (!hash_equals($expectedKey, $apiKeyHeader)) {
            http_response_code(401);
            return "UNAUTHORIZED";
        }

        $uid = $this->request->input('uid') ?? $this->request->query('uid');
        $mode = $this->request->input('mode', 'ONLINE');

        $result = $this->absensiService->processRfidTap($uid, $mode);

        if ($result['status'] === 'OK') {
            return "OK|" . $result['nama'] . ($result['sub_status'] === 'SUDAH_TAP' ? '|SUDAH_TAP' : '');
        }

        return $result['message'] ?? 'ERROR';
    }
    public function ping()
    {
        $apiKeyHeader = $_SERVER['HTTP_X_API_KEY'] ?? $_SERVER['X_API_KEY'] ?? '';
        $expectedKey = env('ESP32_API_KEY', 'SempoaPariaman_ESP32_SecureKey_2026!');
        
        if (!hash_equals($expectedKey, $apiKeyHeader)) {
            http_response_code(401);
            return "UNAUTHORIZED";
        }

        $flagFile = __DIR__ . '/../../../../storage/logs/reset_flag.txt';
        $ack = $this->request->query('ack');

        if ($ack == '1') {
            if (file_exists($flagFile)) {
                unlink($flagFile);
            }
            return "OK";
        }

        if (file_exists($flagFile)) {
            $flagContent = trim(file_get_contents($flagFile));
            return $flagContent === 'FULL_RESET' ? "FULL_RESET" : "RESET";
        }

        return "OK";
    }
}
