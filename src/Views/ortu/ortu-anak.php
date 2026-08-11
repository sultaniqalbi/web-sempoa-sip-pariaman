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
$childTerpakai = max(0, $childTarget - $childSisa);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Orang Tua - Anak Saya - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .tracker-grid {
            display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;
        }
        .tracker-box {
            flex: 1; min-width: 80px; height: 45px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; color: white; font-size: 0.85rem;
        }
        .tracker-green { background: #10b981; }
        .tracker-red { background: #ef4444; }
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
            <li><a href="ortu-dashboard.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="ortu-anak.php" class="active"><i class="fas fa-child"></i> Anak Saya</a></li>
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
                <h1>Detail Anak Saya</h1>
                <p>Informasi jadwal bimbingan, tracker sisa pertemuan, dan riwayat kehadiran anak</p>
            </div>
        </header>

        <section class="dashboard-content">
            <!-- CHILD PROFILE DETAILS -->
            <div class="admin-card">
                <div class="card-header">
                    <h2><i class="fas fa-id-card" style="color: var(--admin-accent);"></i> Kartu Informasi Siswa</h2>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem;">
                    <div>
                        <small style="color: #64748b; font-weight: 600;">Nama Lengkap Anak</small>
                        <h3 id="detail-anak-nama" style="font-size: 1.2rem; color: #1e293b; margin-top: 0.2rem;"><?php echo htmlspecialchars($childNama); ?></h3>
                    </div>
                    <div>
                        <small style="color: #64748b; font-weight: 600;">Program Bimbingan</small>
                        <h3 id="detail-anak-program" style="font-size: 1.2rem; color: #1e293b; margin-top: 0.2rem;"><?php echo htmlspecialchars($childProgram); ?></h3>
                    </div>
                    <div>
                        <small style="color: #64748b; font-weight: 600;">Jadwal Hari Masuk</small>
                        <h3 id="detail-anak-jadwal" style="font-size: 1.2rem; color: #1e293b; margin-top: 0.2rem;"><?php echo htmlspecialchars($childJadwal); ?></h3>
                    </div>
                    <div>
                        <small style="color: #64748b; font-weight: 600;">Durasi Sesi Belajar</small>
                        <h3 style="font-size: 1.2rem; color: #1e293b; margin-top: 0.2rem;">45 Menit / Sesi</h3>
                    </div>
                </div>
            </div>

            <!-- VISUAL TRACKER PERTEMUAN SISA VS TERPAKAI -->
            <div class="admin-card" style="margin-top: 1.5rem;">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <h2><i class="fas fa-tasks" style="color: #10b981;"></i> Tracker Kuota Sesi Pertemuan</h2>
                    <span id="tracker-summary-badge" class="status-badge status-active" style="font-size: 0.9rem; padding: 0.4rem 0.8rem;"><?php echo $childSisa; ?> Sisa / <?php echo $childTarget; ?> Total Pertemuan (Terpakai <?php echo $childTerpakai; ?> Sesi)</span>
                </div>
                <p style="color: #64748b; font-size: 0.9rem; margin-top: 0.5rem;">
                    Kotak <strong style="color: #10b981;">Hijau</strong> menunjukkan sisa kuota sesi yang dapat digunakan. Kotak <strong style="color: #ef4444;">Merah</strong> menunjukkan sesi yang telah terpakai.
                </p>
                <div class="tracker-grid" id="tracker-boxes-container">
                    <?php for ($i = 1; $i <= $childSisa; $i++): ?>
                        <div class="tracker-box tracker-green" title="Sesi Ke-<?php echo $i; ?> Tersedia">#<?php echo $i; ?></div>
                    <?php endfor; ?>
                    <?php for ($j = 1; $j <= $childTerpakai; $j++): ?>
                        <div class="tracker-box tracker-red" title="Sesi Terpakai">✓ Hadir</div>
                    <?php endfor; ?>
                </div>
            </div>

            <!-- TABLE RIWAYAT KEHADIRAN LENGKAP -->
            <div class="admin-card" style="margin-top: 1.5rem;">
                <div class="card-header">
                    <h2><i class="fas fa-calendar-alt" style="color: var(--admin-accent);"></i> Laporan Kehadiran Lengkap</h2>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Tanggal Sesi</th>
                                <th>Jam Sesi</th>
                                <th>Program</th>
                                <th>Durasi Sesi</th>
                                <th>Status Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody id="table-ortu-child-attendance">
                            <tr><td colspan="5" style="text-align:center;">Memuat laporan kehadiran...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </main>

    <script src="src/js/ortu-app.js"></script>
</body>
</html>
