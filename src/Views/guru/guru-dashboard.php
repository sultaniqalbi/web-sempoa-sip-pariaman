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
    <title>Portal Guru - Dashboard Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <!-- SIDEBAR -->
    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2>Portal Guru</h2>
        </div>
        
        <ul class="sidebar-menu">
            <li><a href="guru-dashboard.php" class="active"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="guru-kelas.php"><i class="fas fa-chalkboard-teacher"></i> Kelas Saya</a></li>
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
                <h1>Dashboard Guru</h1>
                <p>Selamat datang kembali, <strong><?php echo htmlspecialchars($user['nama']); ?></strong>!</p>
            </div>
            <div class="header-right">
                <div class="user-profile">
                    <i class="fas fa-user-circle fa-2x" style="color: var(--admin-accent);"></i>
                    <div>
                        <h4><?php echo htmlspecialchars($user['nama']); ?></h4>
                        <small>Pengajar Sempoa SIP</small>
                    </div>
                </div>
            </div>
        </header>

        <section class="dashboard-content">
            <!-- STATS CARDS -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(245, 124, 0, 0.1); color: var(--admin-accent);">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Total Siswa</h3>
                        <p class="stat-number" id="stat-total-siswa">0</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                        <i class="fas fa-chalkboard"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Kelas Mengajar</h3>
                        <p class="stat-number" id="stat-total-kelas">0</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Siswa Full Pertemuan</h3>
                        <p class="stat-number" id="stat-full-pertemuan">0</p>
                    </div>
                </div>
            </div>

            <!-- QUICK ACTION CARD -->
            <div class="admin-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #fff 0%, #fff7ed 100%); border-left: 5px solid var(--admin-accent);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="font-size: 1.3rem; color: #1e293b; margin-bottom: 0.5rem;"><i class="fas fa-calendar-check" style="color: var(--admin-accent);"></i> Jadwal Absensi Hari Ini</h2>
                        <p id="card-jadwal-hari-ini" style="color: #64748b; font-size: 0.95rem;">Memuat info kelas hari ini...</p>
                    </div>
                    <a href="guru-absensi.php" class="btn-primary-admin" style="text-decoration: none; padding: 0.8rem 1.5rem; font-size: 1rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-clipboard-list"></i> Ambil Absensi Hari Ini
                    </a>
                </div>
            </div>

            <!-- TABEL SISWA PERTEMUAN HAMPIR HABIS -->
            <div class="admin-card" style="margin-top: 1.5rem;">
                <div class="card-header">
                    <h2><i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i> Siswa Perlu Perpanjangan Pertemuan</h2>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Nama Siswa</th>
                                <th>Program</th>
                                <th>Jadwal Hari</th>
                                <th>Sisa Pertemuan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="table-guru-dashboard-notif">
                            <tr><td colspan="6" style="text-align:center;">Memuat data notifikasi...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </main>

    <script src="src/js/guru-app.js"></script>
</body>
</html>
