<?php
require_once __DIR__ . '/api/session_helper.php';
require_once __DIR__ . '/api/db.php';

$user = get_current_user_session();
if (!$user || !in_array($user['role'], ['ortu', 'siswa', 'admin', 'owner'])) {
    header('Location: portal-login.html');
    exit;
}

$namaUser  = trim($user['nama'] ?? '');
$emailUser = trim($user['email'] ?? '');
$uidUser   = trim($user['uid'] ?? '');

$siswaData = null;

if (!empty($uidUser)) {
    $stmtS = $conn->prepare("SELECT * FROM siswa WHERE uid = ? AND uid != '' LIMIT 1");
    $stmtS->bind_param("s", $uidUser);
    $stmtS->execute();
    $resS = $stmtS->get_result();
    if ($rowS = $resS->fetch_assoc()) { $siswaData = $rowS; }
    $stmtS->close();
}

if (!$siswaData && !empty($namaUser)) {
    $stmtS = $conn->prepare("SELECT * FROM siswa WHERE nama = ? LIMIT 1");
    $stmtS->bind_param("s", $namaUser);
    $stmtS->execute();
    $resS = $stmtS->get_result();
    if ($rowS = $resS->fetch_assoc()) { $siswaData = $rowS; }
    $stmtS->close();
}

if (!$siswaData && !empty($namaUser)) {
    $likeN = '%' . $namaUser . '%';
    $stmtS = $conn->prepare("SELECT * FROM siswa WHERE nama LIKE ? LIMIT 1");
    $stmtS->bind_param("s", $likeN);
    $stmtS->execute();
    $resS = $stmtS->get_result();
    if ($rowS = $resS->fetch_assoc()) { $siswaData = $rowS; }
    $stmtS->close();
}

if (!$siswaData) {
    $resFirst = $conn->query("SELECT * FROM siswa ORDER BY id ASC LIMIT 1");
    if ($resFirst && $rowFirst = $resFirst->fetch_assoc()) {
        $siswaData = $rowFirst;
    }
}

if (!$siswaData) {
    $siswaData = [
        'id' => 1, 'nama' => (!empty($namaUser) ? $namaUser : 'Anak Sempoa'),
        'kategori_program' => 'Sempoa SIP', 'hari_masuk' => 'Senin, Kamis',
        'status_spp' => 'AKTIF', 'target_pertemuan' => 8, 'sisa_pertemuan' => 8
    ];
}

$childNama = $siswaData['nama'];
$childProgram = $siswaData['kategori_program'] ?? 'Sempoa SIP';
$childJadwal = $siswaData['hari_masuk'] ?? 'Senin, Kamis';
$childTarget = intval($siswaData['target_pertemuan'] ?? 8);
$childSisa = intval($siswaData['sisa_pertemuan'] ?? $childTarget);
$childStatusSpp = $siswaData['status_spp'] ?? 'AKTIF';
$childPct = min(100, max(0, ($childSisa / max(1, $childTarget)) * 100));

$stmtAbs = $conn->prepare("SELECT COUNT(*) AS total FROM absensi_log WHERE (uid = ? AND uid != '') OR nama = ?");
$stmtAbs->bind_param("ss", $siswaData['uid'], $siswaData['nama']);
$stmtAbs->execute();
$resAbs = $stmtAbs->get_result();
$kehadiranCount = ($resAbs && $rA = $resAbs->fetch_assoc()) ? intval($rA['total']) : 0;
$stmtAbs->close();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Orang Tua - Dashboard Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .progress-bar-bg {
            width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; margin-top: 0.5rem;
        }
        .progress-bar-fill {
            height: 100%; background: #10b981; transition: width 0.3s ease;
        }
    </style>
</head>
<body>

    <!-- SIDEBAR -->
    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2>Portal Orang Tua</h2>
        </div>
        
        <ul class="sidebar-menu">
            <li><a href="ortu-dashboard.php" class="active"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="ortu-anak.php"><i class="fas fa-child"></i> Anak Saya</a></li>
            <li><a href="ortu-pembayaran.php"><i class="fas fa-wallet"></i> Pembayaran SPP</a></li>
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
                <h1>Dashboard Orang Tua</h1>
                <p>Selamat datang, <strong><?php echo htmlspecialchars($user['nama']); ?></strong>!</p>
            </div>
            <div class="header-right">
                <div class="user-profile">
                    <i class="fas fa-user-friends fa-2x" style="color: var(--admin-accent);"></i>
                    <div>
                        <h4><?php echo htmlspecialchars($user['nama']); ?></h4>
                        <small>Orang Tua Murid</small>
                    </div>
                </div>
            </div>
        </header>

        <section class="dashboard-content">
            <!-- MAIN CHILD CARD -->
            <div class="admin-card" style="background: linear-gradient(135deg, #fff 0%, #f0fdf4 100%); border-left: 5px solid #10b981;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <small style="color: #059669; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Siswa Terhubung</small>
                        <h2 id="child-nama-title" style="font-size: 1.5rem; color: #1e293b; margin-top: 0.2rem;"><i class="fas fa-user-graduate" style="color: #10b981;"></i> <?php echo htmlspecialchars($childNama); ?></h2>
                        <p id="child-program-subtitle" style="color: #64748b; font-size: 0.95rem; margin-top: 0.2rem;">Program: <?php echo htmlspecialchars($childProgram); ?> | Hari Belajar: <?php echo htmlspecialchars($childJadwal); ?></p>
                    </div>
                    <div>
                        <a href="ortu-anak.php" class="btn-primary-admin" style="text-decoration: none; padding: 0.7rem 1.4rem; border-radius: 8px; font-size: 0.95rem;">
                            <i class="fas fa-search"></i> Lihat Detail Kehadiran
                        </a>
                    </div>
                </div>
            </div>

            <!-- STATS SUB-CARDS GRID -->
            <div class="stats-grid" style="margin-top: 1.5rem;">
                <!-- SUB-CARD 1: KEHADIRAN -->
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Kehadiran Bulan Ini</h3>
                        <p class="stat-number" id="ortu-stat-kehadiran"><?php echo $kehadiranCount; ?> Sesi Hadir</p>
                        <small id="ortu-stat-spp-badge" class="status-badge status-active" style="display: inline-block; margin-top: 0.3rem;"><?php echo htmlspecialchars($childStatusSpp); ?></small>
                    </div>
                </div>

                <!-- SUB-CARD 2: KUOTA SISA PERTEMUAN -->
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(245, 124, 0, 0.1); color: var(--admin-accent);">
                        <i class="fas fa-hourglass-half"></i>
                    </div>
                    <div class="stat-info" style="width: 100%;">
                        <h3>Pertemuan Sisa</h3>
                        <p class="stat-number" id="ortu-stat-sisa"><?php echo $childSisa; ?> Sisa / <?php echo $childTarget; ?> Sesi Total</p>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" id="ortu-progress-bar" style="width: <?php echo $childPct; ?>%; background: <?php echo $childPct > 50 ? '#10b981' : ($childPct > 25 ? '#f59e0b' : '#ef4444'); ?>;"></div>
                        </div>
                    </div>
                </div>

                <!-- SUB-CARD 3: STATUS PEMBAYARAN -->
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Status Pembayaran</h3>
                        <p class="stat-number" id="ortu-stat-pembayaran-text" style="font-size: 1.2rem; color: #10b981;"><?php echo htmlspecialchars($childStatusSpp === 'EXPIRED' ? 'MENUNGGAK' : 'LUNAS'); ?></p>
                        <a href="ortu-pembayaran.php" style="font-size: 0.85rem; color: #3b82f6; text-decoration: none; font-weight: 600;">Upload Bukti &rarr;</a>
                    </div>
                </div>
            </div>

            <!-- TABLE RECENT LOG KEHADIRAN -->
            <div class="admin-card" style="margin-top: 1.5rem;">
                <div class="card-header">
                    <h2><i class="fas fa-history" style="color: var(--admin-accent);"></i> Riwayat Kehadiran Terbaru</h2>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Tanggal & Waktu</th>
                                <th>Program</th>
                                <th>Modus Absensi</th>
                                <th>Status Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody id="table-ortu-recent-absensi">
                            <tr><td colspan="4" style="text-align:center;">Memuat riwayat kehadiran anak...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </main>

    <script src="src/js/ortu-app.js"></script>
</body>
</html>
