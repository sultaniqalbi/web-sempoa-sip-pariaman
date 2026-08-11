<?php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || !in_array($user['role'], ['admin', 'owner'])) {
    header('Location: portal-login.html');
    exit;
}
if ($user['role'] === 'admin') {
    header('Location: portal-admin.php');
    exit;
}
header('Location: owner-keuangan.php');
exit;
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keuangan - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 100; }
        .modal-overlay.active { display: flex; }
        .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 100%; max-width: 500px; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .form-group input, .form-group select { width: 100%; padding: 0.8rem; border: 1px solid var(--admin-border); border-radius: 8px; font-family: inherit; font-size: 0.95rem; }
    </style>
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
            <li><a href="admin-jadwal.php" ><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
            <li><a href="admin-pembayaran.php" ><i class="fas fa-receipt"></i> Reminder SPP</a></li>
            <li><a href="admin-riwayat.php" ><i class="fas fa-history"></i> Riwayat Absensi</a></li>
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
                <input type="text" placeholder="Cari data keuangan siswa...">
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
                <h1>Rekap Keuangan SPP</h1>
                <p>Track record status pembayaran siswa</p>
            </div>
            
            <div class="data-section">
                <div class="data-header">
                    <h2>Status Tagihan Bulan Ini</h2>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Siswa</th>
                                <th>Nama Lengkap</th>
                                <th>Program</th>
                                <th>Status SPP</th>
                                <th>Riwayat Terakhir</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="table-keuangan">
                            <!-- Diisi oleh JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal Riwayat & Tambah Pembayaran -->
    <div class="modal-overlay" id="modalKeuangan">
        <div class="modal-content" style="max-width: 600px;">
            <h2 style="margin-bottom: 0.5rem;" id="modalKeuanganTitle">Riwayat Pembayaran</h2>
            <p id="modalKeuanganSubtitle" style="color: #6b7280; margin-bottom: 1.5rem;"></p>
            
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h3 style="font-size: 1rem; margin-bottom: 1rem; color: #1e293b;">Catat Pembayaran Baru</h3>
                <form id="formKeuangan">
                    <input type="hidden" id="bayarSiswaId">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <div class="form-group" style="flex: 1; min-width: 150px;">
                            <label>Tanggal</label>
                            <input type="date" id="bayarTanggal" required>
                        </div>
                        <div class="form-group" style="flex: 1; min-width: 150px;">
                            <label>Jenis</label>
                            <select id="bayarJenis" required>
                                <option value="SPP Bulanan">SPP Bulanan</option>
                                <option value="Pendaftaran">Pendaftaran</option>
                                <option value="Buku/Alat">Buku/Alat</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1; min-width: 150px;">
                            <label>Nominal (Rp)</label>
                            <input type="number" id="bayarNominal" value="150000" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-primary-admin" style="width: 100%; margin-top: 1rem;">Simpan Pembayaran & Perpanjang SPP</button>
                </form>
            </div>

            <h3 style="font-size: 1rem; margin-bottom: 1rem; color: #1e293b;">Track Record Sebelumnya</h3>
            <div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
                <table style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Jenis</th>
                            <th>Nominal</th>
                        </tr>
                    </thead>
                    <tbody id="table-riwayat-pembayaran">
                        <!-- Diisi oleh JS -->
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 2rem; text-align: right;">
                <button type="button" class="btn-cancel" onclick="closeModal('modalKeuangan')">Tutup</button>
            </div>
        </div>
    </div>

    <script src="src/js/admin-app.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('bayarTanggal').value = today;
        });
    </script>
</body>
</html>

