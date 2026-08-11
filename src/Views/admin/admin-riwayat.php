<?php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || $user['role'] !== 'admin') {
    header('Location: portal-login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Absensi - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- SheetJS for Excel Export -->
    <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
</head>
<body>

    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2>Admin Portal</h2>
        </div>
                <ul class="sidebar-menu">
            <li><a href="portal-admin.php" ><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="admin-siswa.php" ><i class="fas fa-users"></i> Data Siswa</a></li>
            <li><a href="admin-guru.php" ><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
            <li><a href="admin-absensi-guru.php" ><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
            <li><a href="admin-jadwal.php" ><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
            <li><a href="admin-pembayaran.php" ><i class="fas fa-receipt"></i> Reminder SPP</a></li>
            <li><a href="admin-riwayat.php" class="active"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
            <li><a href="admin-galeri.php" ><i class="fas fa-images"></i> Galeri Kegiatan</a></li>
        </ul>
        <div class="sidebar-footer">
            <a href="beranda.html" class="btn-logout" onclick="localStorage.clear();"><i class="fas fa-sign-out-alt"></i> Keluar</a>
        </div>
    </aside>

    <main class="admin-main">
        <header class="admin-header">
            <div class="header-search">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Cari riwayat absen...">
            </div>
            <div class="header-profile" style="position: relative;">
                <button class="icon-btn" onclick="toggleNotif()"><i class="far fa-bell"></i><span class="badge">3</span></button>
                <div class="notif-dropdown" id="notifDropdown">
                    <div class="notif-header">Notifikasi Terbaru</div><div class="notif-item"><div class="notif-item-title">Sistem Siap</div><div>Tidak ada notifikasi baru.</div></div></div>
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
                <h1>Riwayat Absensi</h1>
            </div>
            <div class="data-section" style="margin-bottom: 2rem;">
                <div class="data-header">
                    <h2>Riwayat Absensi Murid</h2>
                    <button class="btn-primary-admin" onclick="downloadExcel('siswa')" style="background-color: #10b981;"><i class="fas fa-file-excel"></i> Download Excel</button>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>UID</th>
                                <th>Nama Lengkap</th>
                                <th>Tanggal & Waktu</th>
                            </tr>
                        </thead>
                        <tbody id="table-riwayat-siswa">
                            <tr><td colspan="3" style="text-align:center;">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="data-section">
                <div class="data-header">
                    <h2>Riwayat Absensi Guru</h2>
                    <button class="btn-primary-admin" onclick="downloadExcel('guru')" style="background-color: #10b981;"><i class="fas fa-file-excel"></i> Download Excel</button>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>UID</th>
                                <th>Nama Lengkap</th>
                                <th>Tanggal & Waktu</th>
                            </tr>
                        </thead>
                        <tbody id="table-riwayat-guru">
                            <tr><td colspan="3" style="text-align:center;">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <script src="src/js/admin-app.js"></script>
    <script>
        // Fetch and render immediately
        if (typeof renderRiwayat === 'function') {
            renderRiwayat();
            // Auto refresh riwayat every 5 seconds
            setInterval(renderRiwayat, 5000);
        }
    </script>
</body>
</html>

