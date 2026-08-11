<?php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || ($user['role'] !== 'admin' && $user['role'] !== 'owner')) {
    header('Location: portal-login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 100;
        }
        .modal-overlay.active { display: flex; }
        .modal-content {
            background: white; padding: 2rem; border-radius: 12px;
            width: 100%; max-width: 500px;
        }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .form-group input, .form-group select {
            width: 100%; padding: 0.8rem; border: 1px solid var(--admin-border);
            border-radius: 8px; font-family: inherit; font-size: 0.95rem;
        }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
        .btn-cancel { padding: 0.6rem 1.2rem; background: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    </style>
</head>
<body>

    <!-- SIDEBAR -->
    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2>Admin Portal</h2>
        </div>
        <ul class="sidebar-menu">
            <li><a href="portal-admin.php" class="active"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="admin-siswa.php"><i class="fas fa-users"></i> Data Siswa</a></li>
            <li><a href="admin-guru.php"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
            <li><a href="admin-absensi-guru.php"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
            <li><a href="admin-jadwal.php"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
            <li><a href="admin-pembayaran.php"><i class="fas fa-receipt"></i> Reminder SPP</a></li>
            <li><a href="admin-riwayat.php"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
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
                <input type="text" placeholder="Cari data siswa, nama guru...">
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
                    <div class="profile-avatar">A</div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.95rem;">Admin Utama</div>
                        <div style="color: var(--admin-text-light); font-size: 0.8rem;">Super Admin</div>
                    </div>
                </div>
            </div>
        </header>

        <!-- DASHBOARD CONTENT -->
        <div class="dashboard-content">
            <div class="page-title">
                <h1>Overview</h1>
                <p>Ringkasan data operasional Sempoa SIP TC Pariaman hari ini.</p>
            </div>

            <!-- STATS CARDS -->
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-icon orange"><i class="fas fa-user-graduate"></i></div>
                    <div class="stat-details">
                        <h3>Total Siswa Aktif</h3>
                        <p id="stat-total-siswa">0</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-chalkboard-teacher"></i></div>
                    <div class="stat-details">
                        <h3>Guru Pengajar</h3>
                        <p id="stat-total-guru">0</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-door-open"></i></div>
                    <div class="stat-details">
                        <h3>Kelas Berjalan</h3>
                        <p id="stat-kelas">0</p>
                    </div>
                </div>
            </div>

            <!-- RECENT STUDENTS TABLE -->
            <div class="data-section">
                <div class="data-header">
                    <h2>Pendaftaran Siswa Baru</h2>
                    <button class="btn-primary-admin" onclick="openModal('modalSiswa')"><i class="fas fa-plus"></i> Tambah Siswa</button>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Nama Lengkap</th>
                                <th>Program</th>
                                <th>Tanggal Daftar</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="table-recent-siswa">
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </main>

    <!-- MODAL: TAMBAH SISWA -->
    <div class="modal-overlay" id="modalSiswa">
        <div class="modal-content">
            <h2 style="margin-bottom: 1.5rem;" id="modalSiswaTitle">Tambah Siswa Baru</h2>
            <form id="formSiswa">
                <input type="hidden" id="siswaId">
                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="siswaNama" required>
                </div>
                <div class="form-group">
                    <label>Program Pilihan</label>
                    <select id="siswaProgram" required>
                        <option value="">-- Pilih Program --</option>
                        <option value="Sempoa SIP">Sempoa SIP</option>
                        <option value="Fonem">Fonem</option>
                        <option value="Tahfidz">Tahfidz</option>
                        <option value="Bahasa Inggris">Bahasa Inggris</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Jumlah Pertemuan</label>
                    <input type="number" id="siswaTarget" required min="1" value="8" placeholder="Contoh: 8 atau 12">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="siswaStatus" required>
                        <option value="Aktif">Aktif</option>
                        <option value="Menunggu">Menunggu</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal('modalSiswa')">Batal</button>
                    <button type="submit" class="btn-primary-admin">Simpan</button>
                </div>
            </form>
        </div>
    </div>

    <script src="src/js/admin-app.js"></script>
</body>
</html>
