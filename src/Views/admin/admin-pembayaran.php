<?php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || !in_array($user['role'], ['admin', 'owner'])) {
    header('Location: portal-login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reminder & Verifikasi Pembayaran - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* Modal styles */
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: none;
            align-items: center; justify-content: center; z-index: 100;
        }
        .modal-overlay.active { display: flex; }
        .modal-content {
            background: white; padding: 2rem; border-radius: 12px;
            width: 100%; max-width: 550px;
        }
        .wa-box {
            background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1.2rem;
            border-radius: 8px; font-family: monospace; font-size: 0.9rem;
            color: #166534; white-space: pre-wrap; margin-bottom: 1.2rem;
            line-height: 1.5;
        }
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
            <li><a href="portal-admin.php" ><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="admin-siswa.php" ><i class="fas fa-users"></i> Data Siswa</a></li>
            <li><a href="admin-guru.php" ><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
            <li><a href="admin-absensi-guru.php" ><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
            <li><a href="admin-jadwal.php" ><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
            <li><a href="admin-pembayaran.php" class="active"><i class="fas fa-receipt"></i> Reminder SPP</a></li>
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
                <input type="text" placeholder="Cari data...">
            </div>
            <div class="header-profile" style="position: relative;">
                <button class="icon-btn" onclick="toggleNotif()"><i class="far fa-bell"></i><span class="badge">3</span></button>
                <div class="notif-dropdown" id="notifDropdown" style="display: none;">
                    <div class="notif-header">Notifikasi Terbaru</div>
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
                <h1>Reminder & Verifikasi Pembayaran</h1>
                <p>Kelola status SPP siswa, kirim reminder WhatsApp, dan verifikasi bukti transfer</p>
            </div>
            
            <!-- SECTION 1: VERIFIKASI BUKTI TRANSFER PENDING -->
            <div class="data-section">
                <div class="data-header">
                    <h2><i class="fas fa-clock" style="color: #f59e0b;"></i> Verifikasi Unggahan Bukti Transfer (Pending)</h2>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Tanggal Unggah</th>
                                <th>Nama Siswa</th>
                                <th>Bukti Transfer</th>
                                <th>Catatan Ortu</th>
                                <th>Aksi Verifikasi</th>
                            </tr>
                        </thead>
                        <tbody id="table-admin-pending-payments">
                            <tr><td colspan="5" style="text-align:center;">Memuat data bukti transfer...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SECTION 2: DAFTAR SISA PERTEMUAN & REMINDER WA -->
            <div class="data-section" style="margin-top: 1.5rem;">
                <div class="data-header" style="flex-wrap: wrap; gap: 1rem;">
                    <h2><i class="fas fa-user-clock" style="color: var(--admin-accent);"></i> Kuota Pertemuan & Status SPP Siswa</h2>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <label style="font-size: 0.9rem; font-weight: 600; color: #475569;">Filter View:</label>
                        <select id="filterReminderStatus" onchange="loadAdminReminderList()" style="padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit;">
                            <option value="semua">Tampilkan Semua Siswa</option>
                            <option value="sisa_le_2" selected>Sisa Pertemuan ≤ 2 (Perlu Reminder)</option>
                            <option value="overdue">Status Menunggak / EXPIRED</option>
                        </select>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Nama Siswa</th>
                                <th>Program</th>
                                <th>Sisa Pertemuan</th>
                                <th>Status SPP</th>
                                <th>Tagihan SPP</th>
                                <th>Aksi Reminder WA</th>
                            </tr>
                        </thead>
                        <tbody id="table-admin-reminder-siswa">
                            <tr><td colspan="6" style="text-align:center;">Memuat data siswa...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- MODAL GENERATOR DRAF PESAN WA -->
    <div class="modal-overlay" id="modalWaReminder">
        <div class="modal-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
                <h3><i class="fab fa-whatsapp" style="color: #25d366;"></i> Draf Pesan Pengingat WhatsApp</h3>
                <button onclick="document.getElementById('modalWaReminder').classList.remove('active')" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
            </div>
            
            <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1rem;">Salin pesan di bawah ini lalu tempel (paste) ke WhatsApp Orang Tua siswa:</p>
            
            <div class="wa-box" id="waMessageContent">
                Memuat draf pesan...
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                <button class="btn-cancel" onclick="document.getElementById('modalWaReminder').classList.remove('active')">Tutup</button>
                <button class="btn-primary-admin" style="background: #25d366; border-color: #25d366;" onclick="copyWaTextToClipboard()">
                    <i class="fas fa-copy"></i> Salin Pesan ke Clipboard
                </button>
            </div>
        </div>
    </div>

    <script src="src/js/admin-app.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            loadAdminPendingPayments();
            loadAdminReminderList();
        });
    </script>
</body>
</html>
