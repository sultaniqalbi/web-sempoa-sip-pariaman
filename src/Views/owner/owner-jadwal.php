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
    <title>Jadwal & Kelas - Owner Portal</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 100; }
        .modal-overlay.active { display: flex; }
        .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 100%; max-width: 550px; }
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
            <li><a href="owner-guru.php"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
            <li><a href="admin-absensi-guru.php"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
            <li><a href="owner-jadwal.php" class="active"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
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
                <input type="text" placeholder="Cari jadwal kelas...">
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
                <h1>Jadwal & Kelas</h1>
                <p>Manajemen jadwal mengajar guru dan daftar kelas siswa</p>
            </div>
            <div class="data-section">
                <div class="data-header">
                    <h2>Daftar Kelas Aktif</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-primary-admin" style="background: #10b981;" onclick="exportJadwalToExcel()"><i class="fas fa-file-excel"></i> Ekspor Excel</button>
                        <button class="btn-primary-admin" onclick="openModal('modalJadwal')"><i class="fas fa-plus"></i> Tambah Kelas</button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>KODE KELAS</th>
                                <th>MATA PELAJARAN</th>
                                <th>GURU PENGAJAR</th>
                                <th>HARI & JAM</th>
                                <th>KAPASITAS</th>
                                <th>AKSI</th>
                            </tr>
                        </thead>
                        <tbody id="table-jadwal"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- MODAL: TAMBAH / EDIT KELAS JADWAL -->
    <div class="modal-overlay" id="modalJadwal">
        <div class="modal-content">
            <h2 style="margin-bottom: 1.5rem;" id="modalJadwalTitle">Tambah Kelas Baru</h2>
            <form id="formJadwal">
                <input type="hidden" id="jadwalIndex">
                <div class="form-group">
                    <label>Kode Kelas</label>
                    <input type="text" id="jadwalId" placeholder="Contoh: J001" required>
                </div>
                <div class="form-group">
                    <label>Mata Pelajaran / Program</label>
                    <select id="jadwalProgram" required>
                        <option value="Sempoa SIP">Sempoa SIP</option>
                        <option value="Fonem">Fonem</option>
                        <option value="Tahfidz">Tahfidz</option>
                        <option value="Bahasa Inggris">Bahasa Inggris</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Guru Pengajar</label>
                    <select id="jadwalGuru" required>
                        <option value="">-- Pilih Guru --</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Hari Bimbingan (Pilih Hari)</label>
                    <div class="pill-checkbox-group">
                        <label><input type="checkbox" name="jadwalHari" value="Senin"> <span>Senin</span></label>
                        <label><input type="checkbox" name="jadwalHari" value="Selasa"> <span>Selasa</span></label>
                        <label><input type="checkbox" name="jadwalHari" value="Rabu"> <span>Rabu</span></label>
                        <label><input type="checkbox" name="jadwalHari" value="Kamis"> <span>Kamis</span></label>
                        <label><input type="checkbox" name="jadwalHari" value="Jumat"> <span>Jumat</span></label>
                        <label><input type="checkbox" name="jadwalHari" value="Sabtu"> <span>Sabtu</span></label>
                        <label><input type="checkbox" name="jadwalHari" value="Minggu"> <span>Minggu</span></label>
                    </div>
                </div>

                <div class="form-group">
                    <label>Sesi Jam Bimbingan (Pilih Jam)</label>
                    <div class="pill-checkbox-group">
                        <label><input type="checkbox" name="jadwalJam" value="07:00-08:00"> <span>07:00-08:00</span></label>
                        <label><input type="checkbox" name="jadwalJam" value="08:00-09:00"> <span>08:00-09:00</span></label>
                        <label><input type="checkbox" name="jadwalJam" value="09:00-10:00"> <span>09:00-10:00</span></label>
                        <label><input type="checkbox" name="jadwalJam" value="10:00-11:00"> <span>10:00-11:00</span></label>
                        <label><input type="checkbox" name="jadwalJam" value="11:00-12:00"> <span>11:00-12:00</span></label>
                        <label><input type="checkbox" name="jadwalJam" value="12:00-13:00"> <span>12:00-13:00</span></label>
                        <label><input type="checkbox" name="jadwalJam" value="13:00-14:00"> <span>13:00-14:00</span></label>
                        <label><input type="checkbox" name="jadwalJam" value="14:00-15:00"> <span>14:00-15:00</span></label>
                        <label><input type="checkbox" name="jadwalJam" value="15:00-16:00"> <span>15:00-16:00</span></label>
                        <label><input type="checkbox" name="jadwalJam" value="16:00-17:00"> <span>16:00-17:00</span></label>
                    </div>
                </div>

                <div class="form-group">
                    <label>Kapasitas Siswa</label>
                    <input type="number" id="jadwalKapasitas" value="15" required>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal('modalJadwal')">Batal</button>
                    <button type="submit" class="btn-primary-admin">Simpan Kelas</button>
                </div>
            </form>
        </div>
    </div>

    <script src="src/js/owner-app.js"></script>
</body>
</html>
