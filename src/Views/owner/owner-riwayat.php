<?php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || $user['role'] !== 'owner') {
    header('Location: portal-login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Absensi - Owner Portal</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <!-- SIDEBAR -->
    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2>Hai Owner</h2>
        </div>
        <ul class="sidebar-menu">
            <li><a href="portal-owner.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="owner-siswa.php"><i class="fas fa-users"></i> Data Siswa</a></li>
            <li><a href="owner-guru.php"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
            <li><a href="admin-absensi-guru.php"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
            <li><a href="owner-jadwal.php"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
            <li><a href="owner-keuangan.php"><i class="fas fa-coins"></i> Keuangan</a></li>
            <li><a href="owner-riwayat.php" class="active"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
            <li><a href="admin-galeri.php"><i class="fas fa-images"></i> Galeri Kegiatan</a></li>
        </ul>
        <div class="sidebar-footer">
            <a href="beranda.html" class="btn-logout" onclick="localStorage.clear();"><i class="fas fa-sign-out-alt"></i> Keluar</a>
        </div>
    </aside>

    <main class="admin-main">
        <!-- HEADER -->
        <header class="admin-header">
            <div class="header-search">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Cari log absensi RFID...">
            </div>
            <div class="header-profile" style="position: relative;">
                <button class="icon-btn" onclick="toggleNotif()"><i class="far fa-bell"></i><span class="badge">0</span></button>
                <div class="notif-dropdown" id="notifDropdown" style="display: none;">
                    <div class="notif-header">Notifikasi Terbaru</div>
                    <div class="notif-item">
                        <div class="notif-item-title">Sistem Siap</div>
                        <div>Tidak ada notifikasi baru.</div>
                    </div>
                </div>
                <div class="profile-info">
                    <div class="profile-avatar">O</div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.95rem;"><?php echo htmlspecialchars($user['nama'] ?? 'Pemilik Utama'); ?></div>
                        <div style="color: var(--admin-text-light); font-size: 0.8rem;">Owner / Founder</div>
                    </div>
                </div>
            </div>
        </header>

        <div class="dashboard-content">
            <div class="page-title">
                <h1>Riwayat Tap RFID Absensi</h1>
                <p>Log mutakhir presensi kehadiran real-time dari perangkat keras RFID ESP32</p>
            </div>
            <div class="data-section">
                <div class="data-header">
                    <h2>Log Presensi Tap Kartu</h2>
                    <button class="btn-primary-admin" style="background: #10b981;" onclick="exportRiwayatToExcel()"><i class="fas fa-file-excel"></i> Ekspor Log Excel</button>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>UID Kartu</th>
                                <th>Nama Pemilik</th>
                                <th>Waktu Tap (WIB)</th>
                                <th>Mode Presensi</th>
                            </tr>
                        </thead>
                        <tbody id="table-riwayat"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <script src="src/js/owner-app.js"></script>
</body>
</html>
