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
    <title>Data Guru - Owner Portal</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 100; }
        .modal-overlay.active { display: flex; }
        .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 100%; max-width: 500px; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .form-group input, .form-group select { width: 100%; padding: 0.8rem; border: 1px solid var(--admin-border); border-radius: 8px; font-family: inherit; font-size: 0.95rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
        .btn-cancel { padding: 0.6rem 1.2rem; background: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
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
            <li><a href="owner-guru.php" class="active"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
            <li><a href="admin-absensi-guru.php"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
            <li><a href="owner-jadwal.php"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
            <li><a href="owner-keuangan.php"><i class="fas fa-coins"></i> Keuangan</a></li>
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
                <input type="text" placeholder="Cari data guru...">
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
                <h1>Data Guru</h1>
            </div>
            <div class="data-section">
                <div class="data-header">
                    <h2>Daftar Pengajar Aktif</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-primary-admin" style="background: #10b981;" onclick="exportGuruToExcel()"><i class="fas fa-file-excel"></i> Ekspor Excel Guru</button>
                        <button class="btn-primary-admin" onclick="openModal('modalGuru')"><i class="fas fa-plus"></i> Tambah Guru</button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>UID Kartu</th>
                                <th>Nama Lengkap</th>
                                <th>Program Ajar</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="table-guru"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- MODAL: TAMBAH / EDIT GURU -->
    <div class="modal-overlay" id="modalGuru">
        <div class="modal-content">
            <h2 style="margin-bottom: 1.5rem;" id="modalGuruTitle">Tambah Guru Baru</h2>
            <form id="formGuru">
                <input type="hidden" id="guruId">
                <div class="form-group">
                    <label>UID Kartu RFID (Tap kartu pada alat untuk auto-fill)</label>
                    <input type="text" id="guruUid" placeholder="Contoh: 83 2A 1F 09" required>
                </div>
                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="guruNama" required placeholder="Contoh: Ibu Ratna Dewi">
                </div>
                <div class="form-group">
                    <label>Nama Panggilan (Otomatis jadi Kata Sandi Portal Guru)</label>
                    <input type="text" id="guruPanggilan" required placeholder="Contoh: Ratna">
                </div>
                <div class="form-group">
                    <label>Username Email (Tanpa domain)</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="text" id="guruEmail" required placeholder="Contoh: ratna" style="flex: 1;">
                        <span style="color: var(--admin-text-light); font-weight: 500;">@sempoasippariaman.com</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Program yang Diajar</label>
                    <select id="guruProgram" required>
                        <option value="Sempoa SIP">Sempoa SIP</option>
                        <option value="Fonem">Fonem</option>
                        <option value="Tahfidz">Tahfidz</option>
                        <option value="Bahasa Inggris">Bahasa Inggris</option>
                    </select>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal('modalGuru')">Batal</button>
                    <button type="submit" class="btn-primary-admin">Simpan</button>
                </div>
            </form>
        </div>
    </div>

    <script src="src/js/owner-app.js"></script>
</body>
</html>
