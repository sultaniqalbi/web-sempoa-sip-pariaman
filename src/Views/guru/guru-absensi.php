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
    <title>Portal Guru - Absensi & Notifikasi - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .tab-menu { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0; }
        .tab-btn {
            padding: 0.8rem 1.5rem; background: none; border: none; font-weight: 600;
            font-size: 0.95rem; color: #64748b; cursor: pointer; border-bottom: 3px solid transparent;
            transition: all 0.2s;
        }
        .tab-btn.active { color: var(--admin-accent); border-bottom-color: var(--admin-accent); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .day-radio-group { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 1.2rem; }
        .day-radio-group label {
            padding: 0.5rem 1rem; background: #f1f5f9; border-radius: 20px; font-weight: 600;
            font-size: 0.88rem; cursor: pointer; border: 1px solid #cbd5e1; transition: all 0.2s;
        }
        .day-radio-group input[type="radio"] { display: none; }
        .day-radio-group input[type="radio"]:checked + label {
            background: var(--admin-accent); color: white; border-color: var(--admin-accent);
        }
    </style>
</head>
<body>

    <!-- SIDEBAR -->
    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2>Portal Guru</h2>
        </div>
        
        <ul class="sidebar-menu">
            <li><a href="guru-dashboard.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="guru-kelas.php"><i class="fas fa-chalkboard-teacher"></i> Kelas Saya</a></li>
            <li><a href="guru-absensi.php" class="active"><i class="fas fa-user-check"></i> Absensi & Notif</a></li>
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
                <h1>Absensi & Notifikasi</h1>
                <p>Input kehadiran murid, pantau absensi mandiri, dan kelola pengingat perpanjangan pertemuan</p>
            </div>
        </header>

        <section class="dashboard-content">
            <!-- TAB NAVIGATION -->
            <div class="tab-menu">
                <button class="tab-btn active" onclick="switchTab('tab-3a', this)"><i class="fas fa-user-check"></i> 3a. Ambil Absensi Siswa</button>
                <button class="tab-btn" onclick="switchTab('tab-3b', this)"><i class="fas fa-id-card"></i> 3b. Absensi Saya Sendiri</button>
                <button class="tab-btn" onclick="switchTab('tab-3c', this)"><i class="fas fa-bell"></i> 3c. Notifikasi (Siswa Full)</button>
            </div>

            <!-- SUB-MENU 3a: AMBIL ABSENSI SISWA -->
            <div id="tab-3a" class="tab-content active">
                <div class="admin-card">
                    <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
                        <h2><i class="fas fa-edit" style="color: var(--admin-accent);"></i> Input Kehadiran Siswa Hari Ini</h2>
                        <input type="text" id="searchAbsensiSiswa" placeholder="Cari nama siswa..." style="padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; width: 250px;">
                    </div>
                    
                    <!-- PILIH HARI -->
                    <div style="margin-bottom: 1rem;">
                        <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Pilih Hari Jadwal Mengajar:</label>
                        <div class="day-radio-group">
                            <input type="radio" id="day-senin" name="filterHariAbsensi" value="Senin">
                            <label for="day-senin">Senin</label>
                            
                            <input type="radio" id="day-selasa" name="filterHariAbsensi" value="Selasa">
                            <label for="day-selasa">Selasa</label>
                            
                            <input type="radio" id="day-rabu" name="filterHariAbsensi" value="Rabu">
                            <label for="day-rabu">Rabu</label>
                            
                            <input type="radio" id="day-kamis" name="filterHariAbsensi" value="Kamis">
                            <label for="day-kamis">Kamis</label>
                            
                            <input type="radio" id="day-jumat" name="filterHariAbsensi" value="Jumat">
                            <label for="day-jumat">Jumat</label>
                            
                            <input type="radio" id="day-sabtu" name="filterHariAbsensi" value="Sabtu">
                            <label for="day-sabtu">Sabtu</label>
                            
                            <input type="radio" id="day-minggu" name="filterHariAbsensi" value="Minggu">
                            <label for="day-minggu">Minggu</label>
                        </div>
                    </div>

                    <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 0.8rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.88rem; color: #92400e;">
                        <i class="fas fa-info-circle"></i> <strong>Informasi:</strong> Tabel di bawah hanya menampilkan siswa yang memiliki jadwal pada hari terpilih dan sisa pertemuan &gt; 0. Siswa yang sisa pertemuannya menjadi 0 setelah absen akan otomatis ditandai <strong>PENUH</strong>.
                    </div>

                    <form id="formSubmitAbsensiMassal">
                        <div class="table-responsive">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nama Siswa</th>
                                        <th>Program</th>
                                        <th>Sisa Pertemuan</th>
                                        <th>Status Kehadiran</th>
                                    </tr>
                                </thead>
                                <tbody id="table-input-absensi-siswa">
                                    <tr><td colspan="4" style="text-align:center;">Pilih hari di atas untuk memuat daftar siswa.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div style="margin-top: 1.5rem; text-align: right;">
                            <button type="submit" class="btn-primary-admin" style="padding: 0.8rem 1.8rem; font-size: 0.95rem; border-radius: 8px;">
                                <i class="fas fa-save"></i> Simpan Absensi Hari Ini
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- SUB-MENU 3b: ABSENSI SAYA SENDIRI -->
            <div id="tab-3b" class="tab-content">
                <div class="admin-card">
                    <div class="card-header">
                        <h2><i class="fas fa-id-card-alt" style="color: var(--admin-accent);"></i> Log Tap RFID & Kehadiran Saya</h2>
                    </div>
                    <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                        <div style="background: #f1f5f9; padding: 1rem 1.5rem; border-radius: 8px; flex: 1; min-width: 180px;">
                            <small style="color: #64748b; font-weight: 600;">Total Kehadiran Bulan Ini</small>
                            <h3 id="stat-self-total" style="font-size: 1.5rem; color: #1e293b; margin-top: 0.3rem;">0 Hari</h3>
                        </div>
                        <div style="background: #ecfdf5; padding: 1rem 1.5rem; border-radius: 8px; flex: 1; min-width: 180px;">
                            <small style="color: #059669; font-weight: 600;">Hadir Tepat Waktu</small>
                            <h3 id="stat-self-hadir" style="font-size: 1.5rem; color: #047857; margin-top: 0.3rem;">0 Hari</h3>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Waktu Tap Masuk</th>
                                    <th>Mode Tap</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="table-self-absensi-guru">
                                <tr><td colspan="4" style="text-align:center;">Memuat riwayat kehadiran...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- SUB-MENU 3c: NOTIFIKASI -->
            <div id="tab-3c" class="tab-content">
                <div class="admin-card">
                    <div class="card-header">
                        <h2><i class="fas fa-bell" style="color: #ef4444;"></i> Notifikasi Siswa Selesai Pertemuan</h2>
                    </div>
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Tanggal Notif</th>
                                    <th>Nama Siswa</th>
                                    <th>Program</th>
                                    <th>Sisa Pertemuan</th>
                                    <th>Aksi Pengingat</th>
                                </tr>
                            </thead>
                            <tbody id="table-notif-siswa-full">
                                <tr><td colspan="5" style="text-align:center;">Memuat daftar notifikasi...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <script src="src/js/guru-app.js"></script>
    <script>
        function switchTab(tabId, btn) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            btn.classList.add('active');
        }
    </script>
</body>
</html>
