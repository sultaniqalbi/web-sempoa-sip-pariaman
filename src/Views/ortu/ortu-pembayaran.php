<?php
require_once __DIR__ . '/api/session_helper.php';
$user = get_current_user_session();
if (!$user || !in_array($user['role'], ['ortu', 'siswa', 'admin', 'owner'])) {
    header('Location: portal-login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Orang Tua - Pembayaran SPP - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <!-- SIDEBAR -->
    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2>Portal Orang Tua</h2>
        </div>
        
        <ul class="sidebar-menu">
            <li><a href="ortu-dashboard.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="ortu-anak.php"><i class="fas fa-child"></i> Anak Saya</a></li>
            <li><a href="ortu-pembayaran.php" class="active"><i class="fas fa-wallet"></i> Pembayaran SPP</a></li>
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
                <h1>Pembayaran SPP Bimbingan</h1>
                <p>Informasi tagihan SPP, nomor rekening resmi, dan pengunggahan bukti transfer</p>
            </div>
        </header>

        <section class="dashboard-content">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                
                <!-- CARD 1: INFORMASI REKENING BANK RESMI -->
                <div class="admin-card" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="color: white; font-size: 1.2rem;"><i class="fas fa-university" style="color: #f57c00;"></i> Rekening Pembayaran</h2>
                        <span class="status-badge status-active" style="background: #059669; color: white;">RESMI</span>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <small style="color: #94a3b8; font-weight: 600;">NAMA BANK</small>
                        <h3 id="info-bank-nama" style="color: #f8fafc; font-size: 1.2rem; margin-top: 0.2rem;">Bank Nagari</h3>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <small style="color: #94a3b8; font-weight: 600;">NOMOR REKENING</small>
                        <h3 id="info-bank-norek" style="color: #fbbf24; font-size: 1.5rem; letter-spacing: 1px; margin-top: 0.2rem;">1234-5678-9012</h3>
                    </div>
                    
                    <div>
                        <small style="color: #94a3b8; font-weight: 600;">ATAS NAMA</small>
                        <h4 id="info-bank-an" style="color: #f8fafc; font-size: 1rem; margin-top: 0.2rem;">Sempoa SIP TC Pariaman</h4>
                    </div>
                </div>

                <!-- CARD 2: RINCIAN TAGIHAN AKTIF -->
                <div class="admin-card">
                    <div class="card-header">
                        <h2><i class="fas fa-file-invoice-dollar" style="color: var(--admin-accent);"></i> Tagihan Periode Ini</h2>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <small style="color: #64748b; font-weight: 600;">Pembayaran Untuk Siswa:</small>
                        <h3 id="tagihan-siswa-nama" style="font-size: 1.2rem; color: #1e293b; margin-top: 0.2rem;">-</h3>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <small style="color: #64748b; font-weight: 600;">Paket Pertemuan:</small>
                        <p id="tagihan-paket-desc" style="color: #334155; font-weight: 600;">8 Sesi Pertemuan (45 Menit / Sesi)</p>
                    </div>
                    <div style="background: #fff7ed; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--admin-accent); margin-bottom: 1rem;">
                        <small style="color: #92400e; font-weight: 600;">TOTAL HARUS DIBAYAR</small>
                        <h2 id="tagihan-nominal" style="color: #c2410c; font-size: 1.6rem; margin-top: 0.2rem;">Rp 150.000</h2>
                        <small id="tagihan-due-date" style="color: #b45309; display: block; margin-top: 0.3rem;">Jatuh Tempo: 25-08-2026</small>
                    </div>
                </div>
            </div>

            <!-- CARD 3: FORM UPLOAD BUKTI TRANSFER -->
            <div class="admin-card" style="margin-top: 1.5rem;">
                <div class="card-header">
                    <h2><i class="fas fa-cloud-upload-alt" style="color: #10b981;"></i> Upload Bukti Transfer</h2>
                </div>
                
                <form id="formUploadBuktiTransfer" enctype="multipart/form-data">
                    <input type="hidden" id="pembayaranIdInput" name="pembayaran_id" value="1">
                    
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label for="fileBuktiTransfer" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">
                            Pilih Berkas Bukti Transfer (JPG, PNG, WEBP, atau PDF - Maks. 5MB):
                        </label>
                        <input type="file" id="fileBuktiTransfer" name="bukti_file" accept="image/jpeg,image/png,image/webp,application/pdf" required style="width: 100%; padding: 0.6rem; border: 1px dashed #cbd5e1; border-radius: 8px; background: #f8fafc;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label for="catatanOrtu" style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">
                            Catatan Tambahan (Opsional):
                        </label>
                        <input type="text" id="catatanOrtu" name="catatan" placeholder="Contoh: Transfer via M-Banking Nagari a.n. Fulan" style="width: 100%; padding: 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px;">
                    </div>
                    
                    <button type="submit" class="btn-primary-admin" style="padding: 0.8rem 1.8rem; font-size: 1rem; border-radius: 8px;">
                        <i class="fas fa-paper-plane"></i> Kirim Bukti Transfer
                    </button>
                </form>
            </div>

            <!-- CARD 4: TABEL RIWAYAT UNGGAHAN BUKTI TRANSFER -->
            <div class="admin-card" style="margin-top: 1.5rem;">
                <div class="card-header">
                    <h2><i class="fas fa-list-alt" style="color: var(--admin-accent);"></i> Riwayat Unggahan Bukti Transfer</h2>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Tanggal Unggah</th>
                                <th>Berkas Bukti</th>
                                <th>Status Verifikasi</th>
                                <th>Catatan Admin</th>
                            </tr>
                        </thead>
                        <tbody id="table-ortu-history-transfer">
                            <tr><td colspan="4" style="text-align:center;">Memuat riwayat unggahan...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </main>

    <script src="src/js/ortu-app.js"></script>
</body>
</html>
