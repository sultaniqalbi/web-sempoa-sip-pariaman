<?php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || !in_array($user['role'], ['admin', 'owner'])) {
    header('Location: portal-login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Absensi Guru - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- SheetJS for Export Excel -->
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <style>
        .tab-menu { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0; }
        .tab-btn {
            padding: 0.8rem 1.5rem; background: none; border: none; font-weight: 600;
            font-size: 0.95rem; color: #64748b; cursor: pointer; border-bottom: 3px solid transparent;
            transition: all 0.2s;
        }
        .tab-btn.active { color: var(--admin-accent); border-bottom-color: var(--admin-accent); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>

    <!-- SIDEBAR -->
    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2><?php echo $user['role'] === 'owner' ? 'Hai Owner' : 'Admin Portal'; ?></h2>
        </div>
        <ul class="sidebar-menu">
            <?php if ($user['role'] === 'owner'): ?>
                <li><a href="portal-owner.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
                <li><a href="owner-siswa.php"><i class="fas fa-users"></i> Data Siswa</a></li>
                <li><a href="owner-guru.php"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
                <li><a href="admin-absensi-guru.php" class="active"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
                <li><a href="owner-jadwal.php"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
                <li><a href="owner-keuangan.php"><i class="fas fa-coins"></i> Keuangan</a></li>
                <li><a href="owner-riwayat.php"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
                <li><a href="admin-galeri.php"><i class="fas fa-images"></i> Galeri Kegiatan</a></li>
            <?php else: ?>
                <li><a href="portal-admin.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
                <li><a href="admin-siswa.php"><i class="fas fa-users"></i> Data Siswa</a></li>
                <li><a href="admin-guru.php"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
                <li><a href="admin-absensi-guru.php" class="active"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
                <li><a href="admin-jadwal.php"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
                <li><a href="admin-pembayaran.php"><i class="fas fa-receipt"></i> Reminder SPP</a></li>
                <li><a href="admin-riwayat.php"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
                <li><a href="admin-galeri.php"><i class="fas fa-images"></i> Galeri Kegiatan</a></li>
            <?php endif; ?>
        </ul>
        <div class="sidebar-footer">
            <a href="beranda.html" class="btn-logout" onclick="localStorage.clear();"><i class="fas fa-sign-out-alt"></i> Keluar</a>
        </div>
    </aside>

    <main class="admin-main">
        <header class="admin-header">
            <div class="header-search">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Cari data guru...">
            </div>
            <div class="header-profile" style="position: relative;">
                <button class="icon-btn" onclick="toggleNotif()"><i class="far fa-bell"></i><span class="badge">3</span></button>
                <div class="notif-dropdown" id="notifDropdown" style="display: none;">
                    <div class="notif-header">Notifikasi Terbaru</div>
                </div>
                <div class="profile-info">
                    <div class="profile-avatar">A</div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.95rem;">Admin Utama</div>
                        <div style="color: var(--admin-text-light); font-size: 0.8rem;">Super Admin</div>
                    </div>
                </div>
            </div>
        </header>

        <div class="dashboard-content">
            <div class="page-title">
                <h1>Laporan Kehadiran Guru</h1>
                <p>Pantau presensi tap RFID guru, rekap bulanan, dan ekspor laporan Excel</p>
            </div>

        <!-- TAB NAVIGATION -->
            <div class="tab-menu">
                <button class="tab-btn active" onclick="switchTabGuru('tab-rekap-guru', this)"><i class="fas fa-file-excel"></i> Rekap Bulanan Guru</button>
                <button class="tab-btn" onclick="switchTabGuru('tab-riwayat-guru', this)"><i class="fas fa-calendar-day"></i> Riwayat Tap Harian</button>
            </div>

            <!-- TAB 1: REKAP BULANAN GURU -->
            <div id="tab-rekap-guru" class="tab-content active">
                <div class="data-section">
                    <div class="data-header" style="flex-wrap: wrap; gap: 1rem;">
                        <h2><i class="fas fa-user-check" style="color: var(--admin-accent);"></i> Rekap Presensi Hadir Guru</h2>
                        <div style="display: flex; gap: 0.8rem; align-items: center; flex-wrap: wrap;">
                            <label style="font-size: 0.9rem; font-weight: 600;">Periode Bulan:</label>
                            <input type="month" id="filterBulanGuru" value="<?php echo date('Y-m'); ?>" onchange="loadRekapAbsensiGuru()" style="padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit;">
                            <button class="btn-primary-admin" style="background: #10b981; border-color: #10b981; padding: 0.5rem 1.2rem; font-size: 0.9rem;" onclick="exportRekapGuruToExcel()">
                                <i class="fas fa-file-excel"></i> Export Excel (.xlsx)
                            </button>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="admin-table" id="tableExportGuru">
                            <thead>
                                <tr>
                                    <th>Nama Guru</th>
                                    <th>Tanggal</th>
                                    <th>Hari</th>
                                    <th>Jam Masuk (HH:MM:SS)</th>
                                    <th>Status Kehadiran</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-rekap-absensi-guru">
                                <tr><td colspan="5" style="text-align:center;">Memuat rekap absensi guru...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TAB 2: RIWAYAT TAP HARIAN GURU -->
            <div id="tab-riwayat-guru" class="tab-content">
                <div class="data-section">
                    <div class="data-header" style="flex-wrap: wrap; gap: 1rem;">
                        <h2><i class="fas fa-list" style="color: var(--admin-accent);"></i> Log Tap RFID Guru per Tanggal</h2>
                        <div style="display: flex; gap: 0.8rem; align-items: center;">
                            <label style="font-size: 0.9rem; font-weight: 600;">Pilih Tanggal:</label>
                            <input type="date" id="filterTanggalGuru" value="<?php echo date('Y-m-d'); ?>" onchange="loadRiwayatTapGuru()" style="padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit;">
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Nama Guru</th>
                                    <th>Waktu / Jam Tap</th>
                                    <th>Modus Tap</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-riwayat-tap-guru">
                                <tr><td colspan="4" style="text-align:center;">Memuat riwayat tap harian...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script src="src/js/admin-app.js"></script>
    <script>
        function switchTabGuru(tabId, btn) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            btn.classList.add('active');
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadRekapAbsensiGuru();
            loadRiwayatTapGuru();
        });
    </script>
</body>
</html>
