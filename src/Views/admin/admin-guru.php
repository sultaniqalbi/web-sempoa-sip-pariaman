<?php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || !in_array($user['role'], ['admin', 'owner'])) {
    header('Location: portal-login.html');
    exit;
}
$isOwner = ($user['role'] === 'owner');
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Guru - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 100; }
        .modal-overlay.active { display: flex; }
        .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .form-group input, .form-group select { width: 100%; padding: 0.8rem; border: 1px solid var(--admin-border); border-radius: 8px; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
        .btn-cancel { padding: 0.6rem 1.2rem; background: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        /* Pill Checkbox hari mengajar */
        .pill-checkbox-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .pill-checkbox-group label { display: flex; align-items: center; gap: 0.3rem; cursor: pointer; }
        .pill-checkbox-group label span { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 20px; padding: 0.3rem 0.8rem; font-size: 0.85rem; transition: all 0.2s; }
        .pill-checkbox-group input[type=checkbox] { display: none; }
        .pill-checkbox-group input[type=checkbox]:checked + span { background: var(--admin-accent); color: white; border-color: var(--admin-accent); }
        /* UID scan notice */
        .uid-scan-hint { margin-top: 0.4rem; font-size: 0.8rem; color: #94a3b8; }
    </style>
</head>
<body>

    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2><?php echo $isOwner ? 'Owner Portal' : 'Admin Portal'; ?></h2>
        </div>
        <ul class="sidebar-menu">
            <?php if ($isOwner): ?>
                <li><a href="portal-owner.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
                <li><a href="owner-siswa.php"><i class="fas fa-users"></i> Data Siswa</a></li>
                <li><a href="owner-guru.php"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
                <li><a href="admin-absensi-guru.php"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
                <li><a href="owner-jadwal.php"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
                <li><a href="owner-keuangan.php"><i class="fas fa-coins"></i> Keuangan</a></li>
                <li><a href="owner-riwayat.php"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
                <li><a href="admin-galeri.php"><i class="fas fa-images"></i> Galeri Kegiatan</a></li>
            <?php else: ?>
                <li><a href="portal-admin.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
                <li><a href="admin-siswa.php"><i class="fas fa-users"></i> Data Siswa</a></li>
                <li><a href="admin-guru.php" class="active"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
                <li><a href="admin-absensi-guru.php"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
                <li><a href="admin-jadwal.php"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
                <li><a href="admin-pembayaran.php"><i class="fas fa-receipt"></i> Reminder SPP</a></li>
                <li><a href="admin-riwayat.php"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
                <li><a href="admin-galeri.php"><i class="fas fa-images"></i> Galeri Kegiatan</a></li>
            <?php endif; ?>
        </ul>
        <div class="sidebar-footer">
            <a href="beranda.html" class="btn-logout" onclick="localStorage.clear(); fetch('./api/index.php?action=logout');"><i class="fas fa-sign-out-alt"></i> Keluar</a>
        </div>
    </aside>

    <main class="admin-main">
        <header class="admin-header">
            <div class="header-left">
                <h1>Data Guru</h1>
                <p>Kelola data seluruh pengajar, kartu RFID, dan jadwal mengajar</p>
            </div>
        </header>

        <div class="dashboard-content">
            <div class="admin-card">
                <div class="card-header">
                    <h2><i class="fas fa-chalkboard-teacher" style="color: var(--admin-accent);"></i> Daftar Seluruh Pengajar</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-primary-admin" style="background: #10b981;" onclick="exportGuruToExcel()"><i class="fas fa-file-excel"></i> Ekspor Excel</button>
                        <button class="btn-primary-admin" onclick="openModal('modalGuru')"><i class="fas fa-plus"></i> Tambah Guru</button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead><tr><th>ID</th><th>Nama Lengkap</th><th>Mata Pelajaran</th><th>Status</th><th>Aksi</th></tr></thead>
                        <tbody id="table-guru"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- MODAL: TAMBAH / EDIT GURU -->
    <div class="modal-overlay" id="modalGuru">
        <div class="modal-content">
            <h2 style="margin-bottom: 1.5rem;" id="modalGuruTitle">Tambah Guru</h2>
            <form id="formGuru">
                <input type="hidden" id="guruId">

                <div class="form-group">
                    <label>UID Kartu RFID <span style="font-weight:400; color:#64748b; font-size:0.82rem;">(Tap kartu di alat → otomatis terisi)</span></label>
                    <input type="text" id="guruUid" placeholder="Tap kartu RFID atau isi manual: 65 44 02 07">
                    <div id="uid-notice" style="margin-top: 8px; padding: 8px 12px; border-radius: 6px; font-size: 0.83rem; border: 1px solid; display: none; line-height: 1.4;"></div>
                    <p class="uid-scan-hint"><i class="fas fa-wifi"></i> Deteksi real-time aktif saat form ini terbuka</p>
                </div>

                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="guruNama" required placeholder="Contoh: Ratna Dewi">
                </div>
                <div class="form-group">
                    <label>Nama Panggilan <span style="font-weight:400; color:#64748b; font-size:0.82rem;">(Otomatis jadi Kata Sandi)</span></label>
                    <input type="text" id="guruPanggilan" required placeholder="Contoh: Ratna">
                </div>
                <div class="form-group">
                    <label>Username Email (Tanpa domain)</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="text" id="guruEmail" required placeholder="Contoh: ratna" style="flex: 1;">
                        <span style="color: var(--admin-text-light); font-weight: 500; white-space: nowrap;">@sempoasippariaman.com</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Mata Pelajaran / Program</label>
                    <select id="guruProgram" required>
                        <option value="">-- Pilih Program --</option>
                        <option value="Sempoa SIP">Sempoa SIP</option>
                        <option value="Fonem">Fonem</option>
                        <option value="Tahfidz">Tahfidz</option>
                        <option value="Bahasa Inggris">Bahasa Inggris</option>
                        <option value="TK">TK</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Hari Mengajar</label>
                    <div class="pill-checkbox-group" id="guruHariContainer">
                        <label><input type="checkbox" name="guruHari" value="Senin"> <span>Senin</span></label>
                        <label><input type="checkbox" name="guruHari" value="Selasa"> <span>Selasa</span></label>
                        <label><input type="checkbox" name="guruHari" value="Rabu"> <span>Rabu</span></label>
                        <label><input type="checkbox" name="guruHari" value="Kamis"> <span>Kamis</span></label>
                        <label><input type="checkbox" name="guruHari" value="Jumat"> <span>Jumat</span></label>
                        <label><input type="checkbox" name="guruHari" value="Sabtu"> <span>Sabtu</span></label>
                        <label><input type="checkbox" name="guruHari" value="Minggu"> <span>Minggu</span></label>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal('modalGuru')">Batal</button>
                    <button type="submit" class="btn-primary-admin">Simpan</button>
                </div>
            </form>
        </div>
    </div>

    <script src="src/js/admin-app.js"></script>
    <script>
    // ============================================================
    //  AUTO-DETECT KARTU RFID — FORM TAMBAH GURU
    //  Polling setiap 2 detik selama modal aktif dan mode TAMBAH.
    //  - Kartu baru (UNREGISTERED): auto-fill UID + flash hijau
    //  - Kartu terdaftar (REGISTERED): peringatan merah + nama pemilik
    //  - Mode EDIT (guruId terisi): polling berhenti, UID tidak berubah
    // ============================================================
    let _uidInterval  = null;
    let _lastSeenUid  = '';

    function _startUidPolling() {
        if (_uidInterval) return;
        _uidInterval = setInterval(_pollUID, 2000);
    }

    function _stopUidPolling() {
        if (_uidInterval) { clearInterval(_uidInterval); _uidInterval = null; }
        _lastSeenUid = '';
        const n = document.getElementById('uid-notice');
        if (n) n.style.display = 'none';
    }

    function _pollUID() {
        const modal    = document.getElementById('modalGuru');
        const uidInput = document.getElementById('guruUid');
        const idInput  = document.getElementById('guruId');
        const notice   = document.getElementById('uid-notice');
        if (!modal || !modal.classList.contains('active')) return;
        if (idInput && idInput.value.trim() !== '') return; // Mode EDIT — jangan timpa

        fetch('./api/get_last_unregistered.php')
            .then(r => r.json())
            .then(data => {
                if (!data.success) return;
                const uid = data.uid;
                if (uid === _lastSeenUid) return; // Sama seperti sebelumnya — abaikan
                _lastSeenUid = uid;

                if (data.status === 'UNREGISTERED') {
                    // ✅ Kartu baru — auto-fill + flash hijau
                    uidInput.value = uid;
                    uidInput.style.transition = 'background-color 0.4s';
                    uidInput.style.backgroundColor = '#dcfce7';
                    setTimeout(() => uidInput.style.backgroundColor = '', 2000);

                    if (notice) {
                        notice.innerHTML  = `<i class="fas fa-check-circle" style="color:#16a34a;"></i> &nbsp;<strong>Kartu baru terdeteksi!</strong> UID: <code style="background:#f0fdf4;padding:2px 6px;border-radius:4px;">${uid}</code> — silakan lengkapi data guru di bawah.`;
                        notice.style.color       = '#15803d';
                        notice.style.background  = '#f0fdf4';
                        notice.style.borderColor = '#86efac';
                        notice.style.display     = 'block';
                    }

                } else if (data.status === 'REGISTERED') {
                    // ⚠️ Kartu sudah terdaftar — peringatan, JANGAN isi UID
                    if (notice) {
                        notice.innerHTML  = `<i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i> &nbsp;Kartu <code style="background:#fef2f2;padding:2px 6px;border-radius:4px;">${uid}</code> sudah terdaftar atas nama <strong>${data.nama}</strong>. Gunakan kartu yang berbeda.`;
                        notice.style.color       = '#991b1b';
                        notice.style.background  = '#fef2f2';
                        notice.style.borderColor = '#fca5a5';
                        notice.style.display     = 'block';
                    }
                }
            })
            .catch(() => {}); // Silent fail — ESP32 mungkin offline
    }

    // MutationObserver: start/stop polling saat modal buka/tutup
    const _modal = document.getElementById('modalGuru');
    if (_modal) {
        new MutationObserver(() => {
            if (_modal.classList.contains('active')) {
                _startUidPolling();
            } else {
                _stopUidPolling();
            }
        }).observe(_modal, { attributes: true, attributeFilter: ['class'] });
    }
    </script>
</body>
</html>
