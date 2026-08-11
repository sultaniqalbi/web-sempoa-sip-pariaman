<?php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || !in_array($user['role'], ['guru', 'admin', 'owner'])) {
    header('Location: portal-login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Guru - Kelas Saya - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .expand-btn {
            background: #e2e8f0; border: none; padding: 0.4rem 0.8rem; border-radius: 6px;
            cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #334155;
            display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s;
        }
        .expand-btn:hover { background: #cbd5e1; }
        .subtable-container {
            background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 0.5rem 0;
            border: 1px solid #e2e8f0;
        }
        /* Modal styles */
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: none;
            align-items: center; justify-content: center; z-index: 100;
        }
        .modal-overlay.active { display: flex; }
        .modal-content {
            background: white; padding: 2rem; border-radius: 12px;
            width: 100%; max-width: 600px;
        }
    </style>
</head>
<body>

    <!-- SIDEBAR -->
    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2>Portal Guru</h2>
        </div>
        
        <ul class="sidebar-menu">
            <li><a href="guru-dashboard.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="guru-kelas.php" class="active"><i class="fas fa-chalkboard-teacher"></i> Kelas Saya</a></li>
            <li><a href="guru-absensi.php"><i class="fas fa-user-check"></i> Absensi & Notif</a></li>
        </ul>
        
        <div class="sidebar-footer">
            <a href="beranda.html" class="btn-logout" onclick="localStorage.clear(); fetch('./api/index.php?action=logout');">
                <i class="fas fa-sign-out-alt"></i> Keluar
            </a>
        </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="admin-main">
        <header class="admin-header">
            <div class="header-left">
                <h1>Daftar Kelas Saya</h1>
                <p>Kelola dan pantau daftar murid di setiap kelas yang Anda ampu</p>
            </div>
        </header>

        <section class="dashboard-content">
            <div class="admin-card">
                <div class="card-header">
                    <h2><i class="fas fa-chalkboard" style="color: var(--admin-accent);"></i> Kelas Yang Diampu</h2>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Program</th>
                                <th>Hari Mengajar</th>
                                <th>Jam Sesi</th>
                                <th>Kapasitas / Siswa</th>
                                <th>Aksi / Daftar Murid</th>
                            </tr>
                        </thead>
                        <tbody id="table-guru-kelas">
                            <tr><td colspan="5" style="text-align:center;">Memuat data kelas...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </main>

    <!-- MODAL DETAIL RIWAYAT ABSENSI SISWA -->
    <div class="modal-overlay" id="modalDetailSiswa">
        <div class="modal-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
                <h3 id="modalSiswaNamaTitle"><i class="fas fa-user-graduate" style="color: var(--admin-accent);"></i> Detail Absensi Siswa</h3>
                <button onclick="document.getElementById('modalDetailSiswa').classList.remove('active')" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
            </div>
            <div id="modalSiswaInfoSub" style="margin-bottom: 1rem; font-size: 0.9rem; color: #475569;"></div>
            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Waktu Tap / Tanggal</th>
                            <th>Status Absensi</th>
                        </tr>
                    </thead>
                    <tbody id="table-modal-siswa-history">
                        <tr><td colspan="2" style="text-align:center;">Memuat riwayat...</td></tr>
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 1.5rem; text-align: right;">
                <button class="btn-cancel" onclick="document.getElementById('modalDetailSiswa').classList.remove('active')">Tutup</button>
            </div>
        </div>
    </div>

    <script src="src/js/guru-app.js"></script>
</body>
</html>
