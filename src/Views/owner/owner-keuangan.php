<?php
// owner-keuangan.php
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
    <title>Keuangan & Analitik - Owner Portal</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000; }
        .modal-overlay.active { display: flex; }
        .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 100%; max-width: 500px; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .form-group input, .form-group select { width: 100%; padding: 0.8rem; border: 1px solid var(--admin-border); border-radius: 8px; font-family: inherit; font-size: 0.95rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
        .btn-cancel { padding: 0.6rem 1.2rem; background: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .chart-card {
            background: white;
            border-radius: var(--admin-radius);
            border: 1px solid var(--admin-border);
            padding: 1.5rem;
            box-shadow: var(--shadow-sm);
        }
        .chart-card h3 {
            font-size: 1.1rem;
            margin-bottom: 1.2rem;
            color: var(--admin-text-dark);
            display: flex;
            align-items: center;
            gap: 0.6rem;
        }
    </style>
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
            <li><a href="owner-keuangan.php" class="active"><i class="fas fa-coins"></i> Keuangan</a></li>
            <li><a href="owner-riwayat.php"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
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
                <input type="text" placeholder="Cari transaksi atau data keuangan...">
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
                <h1>Analitik Keuangan & Pertumbuhan</h1>
                <p>Grafik eksekutif statistik pemasukan bulanan, distribusi pendapatan program, dan pertumbuhan murid.</p>
            </div>
            
            <!-- CHARTS SECTION -->
            <div class="charts-grid">
                <!-- CHART 1: TREND PEMASUKAN BULANAN -->
                <div class="chart-card" style="grid-column: span 2;">
                    <h3><i class="fas fa-chart-line" style="color: #0284c7;"></i> Grafik Trend Pemasukan SPP Bulanan (2026)</h3>
                    <div style="position: relative; height: 260px;">
                        <canvas id="chartPemasukan"></canvas>
                    </div>
                </div>

                <!-- CHART 2: DISTRIBUSI PENDAPATAN PER PROGRAM -->
                <div class="chart-card">
                    <h3><i class="fas fa-chart-pie" style="color: #ea580c;"></i> Pendapatan per Program</h3>
                    <div style="position: relative; height: 260px;">
                        <canvas id="chartDistribusi"></canvas>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <!-- CHART 3: GRAFIK PERTUMBUHAN SISWA & GURU -->
                <div class="chart-card" style="grid-column: span 3;">
                    <h3><i class="fas fa-chart-bar" style="color: #16a34a;"></i> Grafik Pertumbuhan Siswa & Guru Baru (Kumulatif)</h3>
                    <div style="position: relative; height: 240px;">
                        <canvas id="chartPertumbuhan"></canvas>
                    </div>
                </div>
            </div>

            <!-- TABLE SECTION -->
            <div class="data-section">
                <div class="data-header">
                    <h2>Status Pembayaran SPP Murid</h2>
                    <button class="btn-primary-admin" style="background: #10b981;" onclick="exportKeuanganToExcel()"><i class="fas fa-file-excel"></i> Ekspor Excel Keuangan</button>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Siswa</th>
                                <th>Nama Siswa</th>
                                <th>Program</th>
                                <th>Status SPP</th>
                                <th>Pembayaran Terakhir</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="table-keuangan"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- MODAL: DETAIL & CATAT PEMBAYARAN -->
    <div class="modal-overlay" id="modalKeuangan">
        <div class="modal-content" style="max-width: 600px;">
            <h2 style="margin-bottom: 1rem;" id="modalKeuanganTitle">Detail Pembayaran Siswa</h2>
            
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;" id="keuanganSiswaInfo">
            </div>

            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Riwayat Transaksi</h3>
            <div class="table-responsive" style="max-height: 150px; overflow-y: auto; margin-bottom: 1.5rem;">
                <table style="font-size: 0.85rem;">
                    <thead><tr><th>Tanggal</th><th>Jenis Pembayaran</th><th>Nominal</th></tr></thead>
                    <tbody id="table-history-keuangan"></tbody>
                </table>
            </div>

            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Catat Pembayaran Baru</h3>
            <form id="formKeuangan">
                <input type="hidden" id="bayarSiswaId">
                <div class="form-group">
                    <label>Tanggal Pembayaran</label>
                    <input type="date" id="bayarTanggal" required>
                </div>
                <div class="form-group">
                    <label>Jenis Pembayaran</label>
                    <select id="bayarJenis" required>
                        <option value="SPP Bulanan">SPP Bulanan</option>
                        <option value="Uang Pendaftaran">Uang Pendaftaran</option>
                        <option value="Pembelian Modul/Buku">Pembelian Modul/Buku</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Nominal (Rp)</label>
                    <input type="number" id="bayarNominal" placeholder="Contoh: 150000" required>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal('modalKeuangan')">Tutup</button>
                    <button type="submit" class="btn-primary-admin">Simpan Pembayaran</button>
                </div>
            </form>
        </div>
    </div>

    <script src="src/js/owner-app.js"></script>
</body>
</html>
