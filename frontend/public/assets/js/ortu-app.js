function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
        {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]
    ));
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('child-nama-title')) {
        loadOrtuDashboard();
    }
    if (document.getElementById('detail-anak-nama')) {
        loadOrtuChildDetail();
    }
    if (document.getElementById('tagihan-siswa-nama')) {
        loadOrtuPembayaran();
    }
});

// --- MENU 1: DASHBOARD ORTU ---
function loadOrtuDashboard() {
    fetch('./api/index.php?action=getOrtuDashboardData')
        .then(res => res.json())
        .then(res => {
            if (!res.success) return;
            const d = res.data;
            const siswa = d.siswa || {};
            
            const elNama = document.getElementById('child-nama-title');
            const elProg = document.getElementById('child-program-subtitle');
            const elKehadiran = document.getElementById('ortu-stat-kehadiran');
            const elBadgeSpp = document.getElementById('ortu-stat-spp-badge');
            const elSisa = document.getElementById('ortu-stat-sisa');
            const elBar = document.getElementById('ortu-progress-bar');
            const elBayar = document.getElementById('ortu-stat-pembayaran-text');
            
            if (elNama) elNama.innerHTML = `<i class="fas fa-user-graduate" style="color: #10b981;"></i> ${escHtml(siswa.nama || 'Anak Terhubung')}`;
            if (elProg) elProg.textContent = `Program: ${siswa.kategori_program || 'Sempoa SIP'} | Hari Belajar: ${siswa.hari_masuk || 'Senin, Kamis'}`;
            if (elKehadiran) elKehadiran.textContent = (d.kehadiran_bulan_ini || 0) + ' Sesi Hadir';
            
            const statusSPP = siswa.status_spp || 'AKTIF';
            if (elBadgeSpp) {
                elBadgeSpp.textContent = statusSPP;
                elBadgeSpp.className = `status-badge ${statusSPP === 'AKTIF' ? 'status-active' : 'status-pending'}`;
            }
            
            const target = parseInt(siswa.target_pertemuan || 8, 10);
            const sisa = (siswa.sisa_pertemuan !== undefined && siswa.sisa_pertemuan !== null) ? parseInt(siswa.sisa_pertemuan, 10) : target;
            const terpakai = Math.max(0, target - sisa);
            
            if (elSisa) elSisa.textContent = `${sisa} Sisa / ${target} Sesi Total`;
            if (elBar) {
                const pct = Math.min(100, Math.max(0, (sisa / target) * 100));
                elBar.style.width = pct + '%';
                if (pct > 50) {
                    elBar.style.background = '#10b981'; // Green
                } else if (pct > 25) {
                    elBar.style.background = '#f59e0b'; // Amber
                } else {
                    elBar.style.background = '#ef4444'; // Red
                }
            }
            
            const statusBayar = d.status_pembayaran || 'LUNAS';
            if (elBayar) {
                elBayar.textContent = statusBayar;
                elBayar.style.color = statusBayar === 'LUNAS' ? '#10b981' : '#ef4444';
            }
            
            const tbodyRecent = document.getElementById('table-ortu-recent-absensi');
            if (tbodyRecent) {
                tbodyRecent.innerHTML = '';
                if (!d.riwayat || d.riwayat.length === 0) {
                    tbodyRecent.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding: 1.5rem;">Belum ada log kehadiran tercatat bulan ini.</td></tr>';
                } else {
                    d.riwayat.slice(0, 5).forEach(r => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><i class="far fa-calendar-alt" style="color: #10b981; margin-right: 0.4rem;"></i> ${escHtml(r.waktu)}</td>
                            <td>${escHtml(siswa.kategori_program || 'Sempoa SIP')}</td>
                            <td><span class="status-badge status-active">${escHtml(r.mode || 'ONLINE/TAP')}</span></td>
                            <td><span class="status-badge status-active"><i class="fas fa-check-circle"></i> HADIR</span></td>
                        `;
                        tbodyRecent.appendChild(tr);
                    });
                }
            }
        })
        .catch(err => console.error(err));
}

// --- MENU 2: ANAK SAYA ---
function loadOrtuChildDetail() {
    fetch('./api/index.php?action=getOrtuChildDetail')
        .then(res => res.json())
        .then(res => {
            if (!res.success) return;
            const d = res.data;
            const siswa = d.siswa || {};
            
            const elNama = document.getElementById('detail-anak-nama');
            const elProg = document.getElementById('detail-anak-program');
            const elJadwal = document.getElementById('detail-anak-jadwal');
            
            if (elNama) elNama.textContent = siswa.nama || 'Anak Terhubung';
            if (elProg) elProg.textContent = siswa.kategori_program || 'Sempoa SIP';
            if (elJadwal) elJadwal.textContent = siswa.hari_masuk || 'Senin, Kamis';
            
            const target = parseInt(siswa.target_pertemuan || 8, 10);
            const sisa = (siswa.sisa_pertemuan !== undefined && siswa.sisa_pertemuan !== null) ? parseInt(siswa.sisa_pertemuan, 10) : target;
            const terpakai = Math.max(0, target - sisa);
            
            const elSummaryBadge = document.getElementById('tracker-summary-badge');
            if (elSummaryBadge) elSummaryBadge.textContent = `${sisa} Sisa / ${target} Total Pertemuan (Terpakai ${terpakai} Sesi)`;
            
            const trackerContainer = document.getElementById('tracker-boxes-container');
            if (trackerContainer) {
                trackerContainer.innerHTML = '';
                // Render green boxes for remaining sessions
                for (let i = 1; i <= sisa; i++) {
                    const box = document.createElement('div');
                    box.className = 'tracker-box tracker-green';
                    box.textContent = `#${i}`;
                    box.title = `Sesi Ke-${i} Tersedia (Sisa Kuota)`;
                    trackerContainer.appendChild(box);
                }
                // Render red/used boxes for used sessions
                for (let j = 1; j <= terpakai; j++) {
                    const box = document.createElement('div');
                    box.className = 'tracker-box tracker-red';
                    box.textContent = 'Hadir';
                    box.title = `Sesi Ke-${sisa + j} Terpakai (Siswa Hadir)`;
                    trackerContainer.appendChild(box);
                }
            }
            
            const tbodyAbsensi = document.getElementById('table-ortu-child-attendance');
            if (tbodyAbsensi) {
                tbodyAbsensi.innerHTML = '';
                if (!d.riwayat || d.riwayat.length === 0) {
                    tbodyAbsensi.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b; padding: 1.5rem;">Belum ada riwayat presensi tercatat.</td></tr>';
                } else {
                    d.riwayat.forEach(r => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><i class="far fa-calendar-alt" style="color: #10b981; margin-right: 0.4rem;"></i> ${escHtml(r.tanggal || r.waktu)}</td>
                            <td>${escHtml(r.jam || '14:00')} WIB</td>
                            <td>${escHtml(siswa.kategori_program || 'Sempoa SIP')}</td>
                            <td>45 Menit / Sesi</td>
                            <td><span class="status-badge status-active"><i class="fas fa-check-circle"></i> HADIR</span></td>
                        `;
                        tbodyAbsensi.appendChild(tr);
                    });
                }
            }
        })
        .catch(err => console.error(err));
}

// --- MENU 3: PEMBAYARAN SPP ---
function loadOrtuPembayaran() {
    fetch('./api/index.php?action=getOrtuPembayaranInfo')
        .then(res => res.json())
        .then(res => {
            if (!res.success) return;
            const d = res.data;
            
            const elBankNama = document.getElementById('info-bank-nama');
            const elBankNorek = document.getElementById('info-bank-norek');
            const elBankAn = document.getElementById('info-bank-an');
            
            if (elBankNama) elBankNama.textContent = d.rekening_bank || 'Bank Nagari';
            if (elBankNorek) elBankNorek.textContent = d.rekening_nomor || '1234-5678-9012';
            if (elBankAn) elBankAn.textContent = d.rekening_nama || 'Sempoa SIP TC Pariaman';
            
            const elNamaSiswa = document.getElementById('tagihan-siswa-nama');
            const elNominal = document.getElementById('tagihan-nominal');
            const elDueDate = document.getElementById('tagihan-due-date');
            const elInputId = document.getElementById('pembayaranIdInput');
            
            if (elNamaSiswa) elNamaSiswa.textContent = d.nama_siswa || '-';
            if (elNominal) elNominal.textContent = 'Rp ' + parseInt(d.jumlah_tagihan || 150000).toLocaleString('id-ID');
            if (elDueDate) elDueDate.textContent = 'Jatuh Tempo: ' + (d.due_date || 'Akhir Bulan');
            if (elInputId && d.pembayaran_id) elInputId.value = d.pembayaran_id;
            
            const tbodyHistory = document.getElementById('table-ortu-history-transfer');
            if (tbodyHistory) {
                tbodyHistory.innerHTML = '';
                if (!d.bukti_list || d.bukti_list.length === 0) {
                    tbodyHistory.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b;">Belum ada bukti transfer yang diunggah.</td></tr>';
                } else {
                    d.bukti_list.forEach(b => {
                        const tr = document.createElement('tr');
                        const statusClass = b.status === 'approved' ? 'status-active' : (b.status === 'rejected' ? 'status-pending' : 'status-pending');
                        const statusLabel = b.status === 'approved' ? 'DISETUJUI' : (b.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU VERIFIKASI');
                        
                        tr.innerHTML = `
                            <td>${escHtml(b.created_at)}</td>
                            <td><a href="${escHtml(b.file_path)}" target="_blank" style="color:var(--admin-accent); font-weight:600;"><i class="fas fa-file-image"></i> Lihat Bukti</a></td>
                            <td><span class="status-badge ${statusClass}">${escHtml(statusLabel)}</span></td>
                            <td>${escHtml(b.admin_note || '-')}</td>
                        `;
                        tbodyHistory.appendChild(tr);
                    });
                }
            }
        })
        .catch(err => console.error(err));

    const formUpload = document.getElementById('formUploadBuktiTransfer');
    if (formUpload) {
        formUpload.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(formUpload);
            
            fetch('./api/index.php?action=uploadBuktiTransferOrtu', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        alert("Berhasil! Bukti transfer Anda telah dikirim dan sedang menunggu verifikasi Admin.");
                        formUpload.reset();
                        loadOrtuPembayaran();
                    } else {
                        alert("Gagal mengunggah bukti transfer: " + (res.message || ''));
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert("Terjadi kesalahan jaringan saat mengunggah bukti transfer.");
                });
        });
    }
}
