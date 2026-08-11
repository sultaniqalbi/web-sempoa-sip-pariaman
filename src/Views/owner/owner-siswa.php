<?php
// owner-siswa.php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || !in_array($user['role'], ['owner', 'admin'])) {
    header('Location: portal-login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Siswa - Hai Owner</title>
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

    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2>Hai Owner</h2>
        </div>
        <ul class="sidebar-menu">
            <li><a href="portal-owner.php" ><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="owner-siswa.php" class="active"><i class="fas fa-users"></i> Data Siswa</a></li>
            <li><a href="owner-guru.php" ><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
            <li><a href="admin-absensi-guru.php" ><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
            <li><a href="owner-jadwal.php" ><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
            <li><a href="owner-keuangan.php" ><i class="fas fa-coins"></i> Keuangan</a></li>
            <li><a href="owner-riwayat.php" ><i class="fas fa-history"></i> Riwayat Absensi</a></li>
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
                <input type="text" placeholder="Cari data siswa...">
            </div>
            <div class="header-profile" style="position: relative;">
                <button class="icon-btn" onclick="toggleNotif()"><i class="far fa-bell"></i><span class="badge">3</span></button>
                <div class="notif-dropdown" id="notifDropdown">
                    <div class="notif-header">Notifikasi Terbaru</div>
                    <div class="notif-item">
                        <div class="notif-item-title">Siswa Baru Terdaftar</div>
                        <div>Budi Santoso baru saja mendaftar.</div>
                        <div class="notif-item-time">10 Menit yang lalu</div>
                    </div>
                </div>
                <div class="profile-info" id="btnProfileInfo" style="cursor: pointer;">
                    <div class="profile-avatar"><?php echo strtoupper(substr($user['nama'], 0, 1)); ?></div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.95rem;"><?php echo htmlspecialchars($user['nama']); ?></div>
                        <div style="color: var(--admin-text-light); font-size: 0.8rem;">Pemilik Utama</div>
                    </div>
                </div>
            </div>
        </header>

        <div class="dashboard-content">
            <div class="page-title">
                <h1>Data Siswa</h1>
            </div>
            <div class="data-section">
                <div class="data-header">
                    <h2>Daftar Seluruh Siswa</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-primary-admin" style="background: #10b981;" onclick="exportSiswaToExcel()"><i class="fas fa-file-excel"></i> Ekspor Excel</button>
                        <button class="btn-primary-admin" onclick="openModal('modalSiswa')"><i class="fas fa-plus"></i> Tambah Siswa</button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>ID</th><th>Nama Lengkap</th><th>Program</th><th>Tanggal Daftar</th><th>Status</th><th>Aksi</th></tr></thead>
                        <tbody id="table-siswa"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

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
                    <label>Nama Panggilan (Otomatis jadi Kata Sandi)</label>
                    <input type="text" id="siswaPanggilan" required placeholder="Contoh: Rehan">
                </div>
                <div class="form-group">
                    <label>Username Email (Tanpa domain)</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="text" id="siswaEmail" required placeholder="Contoh: rehan" style="flex: 1;">
                        <span style="color: var(--admin-text-light); font-weight: 500;">@sempoasippariaman.com</span>
                    </div>
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
                    <label>Guru Pengajar</label>
                    <select id="siswaGuru" required>
                        <option value="">-- Pilih Guru --</option>
                    </select>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal('modalSiswa')">Batal</button>
                    <button type="submit" class="btn-primary-admin">Simpan</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        window.userSession = <?php echo json_encode($user); ?>;
        window.currentUserRole = '<?php echo strtolower($user['role'] ?? 'owner'); ?>';
    </script>
    <script src="src/js/owner-app.js"></script>
    <script src="src/js/profile-editor.js"></script>
</body>
</html>
