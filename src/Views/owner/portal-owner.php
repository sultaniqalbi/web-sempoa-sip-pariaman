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
    <title>Owner Portal - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000;
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
        .btn-danger-reset {
            background: #ef4444; color: white; border: none; padding: 0.6rem 1.2rem;
            border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;
            transition: background 0.2s;
        }
        .btn-danger-reset:hover { background: #dc2626; }
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
            <li><a href="portal-owner.php" class="active"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="owner-siswa.php"><i class="fas fa-users"></i> Data Siswa</a></li>
            <li><a href="owner-guru.php"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
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
                <input type="text" placeholder="Cari data operasional, siswa...">
            </div>
            
            <div style="display: flex; align-items: center; gap: 1.2rem;">
                <button class="btn-danger-reset" onclick="openModal('modalResetData')">
                    <i class="fas fa-trash-restore"></i> Reset Semua Data
                </button>
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
            </div>
        </header>

        <!-- DASHBOARD CONTENT -->
        <div class="dashboard-content">
            <div class="page-title">
                <h1>Overview Pemilik</h1>
                <p>Ringkasan data operasional dan eksekutif Sempoa SIP TC Pariaman hari ini.</p>
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
                    <div class="stat-icon green"><i class="fas fa-coins"></i></div>
                    <div class="stat-details">
                        <h3>Total Pendapatan SPP</h3>
                        <p id="stat-pendapatan">Rp 0</p>
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
                    <input type="text" id="siswaNama" required placeholder="Contoh: Budi Santoso">
                </div>
                <div class="form-group">
                    <label>Nama Panggilan (Otomatis jadi Kata Sandi Portal Ortu)</label>
                    <input type="text" id="siswaPanggilan" required placeholder="Contoh: Budi">
                </div>
                <div class="form-group">
                    <label>Username Email (Tanpa domain)</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="text" id="siswaEmail" required placeholder="Contoh: budi" style="flex: 1;">
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

    <!-- MODAL: RESET SEMUA DATA (KHUSUS OWNER) -->
    <div class="modal-overlay" id="modalResetData">
        <div class="modal-content" style="border-top: 5px solid #ef4444;">
            <h2 style="margin-bottom: 0.8rem; color: #dc2626;"><i class="fas fa-exclamation-triangle"></i> Konfirmasi Reset Semua Data</h2>
            <p style="font-size: 0.9rem; color: #475569; line-height: 1.5; margin-bottom: 1rem;">
                <strong>PERINGATAN SANGAT PENTING:</strong> Tindakan ini akan <strong>MENGHAPUS BERSIH</strong> seluruh data siswa, data guru, riwayat absensi, log RFID, serta transaksi keuangan dari database.
            </p>
            <p style="font-size: 0.85rem; color: #166534; background: #f0fdf4; padding: 0.8rem; border-radius: 8px; margin-bottom: 1.2rem;">
                <i class="fas fa-shield-alt"></i> Data Akun Login <strong>Owner & Admin</strong> serta seluruh foto pada <strong>Galeri Kegiatan</strong> dijamin TETAP AMAN dan TIDAK AKAN terhapus.
            </p>
            <form onsubmit="event.preventDefault(); triggerDatabaseReset();">
                <div class="form-group">
                    <label>Ketik <code>CONFIRM_RESET_DATABASE</code> untuk melanjutkan:</label>
                    <input type="text" id="inputResetConfirm" placeholder="CONFIRM_RESET_DATABASE" required autocomplete="off" style="border-color: #fca5a5;">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal('modalResetData')">Batal</button>
                    <button type="submit" class="btn-danger-reset"><i class="fas fa-trash-alt"></i> Ya, Kosongkan Semua Data</button>
                </div>
            </form>
        </div>
    </div>

    <script src="src/js/owner-app.js"></script>
</body>
</html>
