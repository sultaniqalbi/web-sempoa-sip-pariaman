function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
        {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]
    ));
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stat-total-siswa')) {
        loadGuruDashboard();
    }
    if (document.getElementById('table-guru-kelas')) {
        loadGuruKelas();
    }
    if (document.getElementById('table-input-absensi-siswa')) {
        initGuruAbsensiPage();
    }
});

// --- MENU 1: DASHBOARD GURU ---
function loadGuruDashboard() {
    fetch('./api/index.php?action=getGuruDashboard')
        .then(res => res.json())
        .then(res => {
            if (!res.success) return;
            const data = res.data;
            
            const elTotalSiswa = document.getElementById('stat-total-siswa');
            const elTotalKelas = document.getElementById('stat-total-kelas');
            const elFullPertemuan = document.getElementById('stat-full-pertemuan');
            const elCardJadwal = document.getElementById('card-jadwal-hari-ini');
            
            if (elTotalSiswa) elTotalSiswa.textContent = data.total_siswa || 0;
            if (elTotalKelas) elTotalKelas.textContent = data.total_kelas || 0;
            if (elFullPertemuan) elFullPertemuan.textContent = data.siswa_full_count || 0;
            
            if (elCardJadwal) {
                elCardJadwal.innerHTML = `Hari ini <strong>${escHtml(data.hari_ini)}</strong> | Program <strong>${escHtml(data.program_diampu || 'Semua Program')}</strong> — <strong>${data.siswa_hari_ini_count || 0}</strong> siswa menunggu absensi. <div id="guru-today-tap-badge" style="margin-top:0.5rem;"></div>`;
            }
            
            fetch('./api/index.php?action=getAbsensiGuruHariIni')
                .then(r => r.json())
                .then(r => {
                    if (r.success && r.data) {
                        const statusBadge = document.getElementById('guru-today-tap-badge');
                        if (statusBadge) {
                            if (r.data.status === 'Hadir') {
                                statusBadge.innerHTML = `<span class="status-badge status-active"><i class="fas fa-check-circle"></i> ✅ Presensi RFID Hadir Jam ${escHtml(r.data.jam_masuk)}</span>`;
                            } else if (r.data.status === 'Terlambat') {
                                statusBadge.innerHTML = `<span class="status-badge status-pending" style="background:#fff7ed; color:#c2410c;"><i class="fas fa-clock"></i> ⏰ Presensi RFID Terlambat Jam ${escHtml(r.data.jam_masuk)}</span>`;
                            } else {
                                statusBadge.innerHTML = `<span class="status-badge status-pending"><i class="fas fa-exclamation-circle"></i> ⚠️ Belum Presensi Tap RFID Hari Ini</span>`;
                            }
                        }
                    }
                }).catch(err => console.error(err));
            
            const tbodyNotif = document.getElementById('table-guru-dashboard-notif');
            if (tbodyNotif) {
                tbodyNotif.innerHTML = '';
                if (!data.siswa_full || data.siswa_full.length === 0) {
                    tbodyNotif.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748b;">Semua siswa masih memiliki sisa pertemuan aktif.</td></tr>';
                } else {
                    data.siswa_full.forEach(s => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td style="font-weight:600;">${escHtml(s.nama)}</td>
                            <td>${escHtml(s.kategori_program)}</td>
                            <td>${escHtml(s.hari_masuk)}</td>
                            <td><span class="status-badge status-pending" style="background:#fee2e2; color:#ef4444;">${escHtml(s.sisa_pertemuan)} Pertemuan</span></td>
                            <td><span class="status-badge status-pending">${escHtml(s.status_spp || 'EXPIRED')}</span></td>
                            <td>
                                <button class="btn-cancel" style="padding:0.3rem 0.6rem; font-size:0.8rem; background:#25d366; color:white; border-radius:4px; cursor:pointer;" onclick="copyWaReminder('${escHtml(s.nama)}', '${escHtml(s.kategori_program)}')">
                                    <i class="fab fa-whatsapp"></i> Reminder WA
                                </button>
                            </td>
                        `;
                        tbodyNotif.appendChild(tr);
                    });
                }
            }
        })
        .catch(err => console.error(err));
}

// --- MENU 2: KELAS SAYA ---
let globalKelasData = [];

function loadGuruKelas() {
    fetch('./api/index.php?action=getKelasGuru')
        .then(res => res.json())
        .then(res => {
            if (!res.success) return;
            globalKelasData = res.data || [];
            renderTabelKelasGuru(globalKelasData);
        })
        .catch(err => console.error(err));
}

function renderTabelKelasGuru(kelasList) {
    const tbody = document.getElementById('table-guru-kelas');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (kelasList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Belum ada kelas yang diampu.</td></tr>';
        return;
    }
    
    kelasList.forEach((k, idx) => {
        const trMain = document.createElement('tr');
        trMain.innerHTML = `
            <td style="font-weight:600;">${escHtml(k.program)}</td>
            <td>${escHtml(k.hari)}</td>
            <td>${escHtml(k.jam || '14:00 - 15:30')}</td>
            <td>${k.siswa_list ? k.siswa_list.length : 0} Siswa</td>
            <td>
                <button class="expand-btn" onclick="toggleExpandKelas(${idx}, this)">
                    <i class="fas fa-chevron-down"></i> Lihat Daftar Murid
                </button>
            </td>
        `;
        tbody.appendChild(trMain);
        
        const trSub = document.createElement('tr');
        trSub.id = `expand-row-${idx}`;
        trSub.style.display = 'none';
        
        let siswaHtml = '';
        if (!k.siswa_list || k.siswa_list.length === 0) {
            siswaHtml = '<p style="color:#64748b; font-size:0.88rem;">Belum ada murid di kelas ini.</p>';
        } else {
            siswaHtml = `
                <table class="admin-table" style="font-size:0.88rem; background:white; border-radius:6px; overflow:hidden;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th>Nama Murid</th>
                            <th>Kehadiran Bulan Ini</th>
                            <th>Sisa Pertemuan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            k.siswa_list.forEach(s => {
                siswaHtml += `
                    <tr>
                        <td style="font-weight:600;">${escHtml(s.nama)}</td>
                        <td>${s.kehadiran_bulan_ini || 0} Sesion</td>
                        <td><span class="status-badge ${s.sisa_pertemuan > 0 ? 'status-active' : 'status-pending'}">${s.sisa_pertemuan || 0} Pertemuan</span></td>
                        <td>
                            <button class="btn-cancel" style="padding:0.25rem 0.5rem; font-size:0.78rem;" onclick="viewDetailAbsensiSiswa('${escHtml(s.uid)}', '${escHtml(s.nama)}')">
                                <i class="fas fa-eye"></i> Lihat Detail
                            </button>
                        </td>
                    </tr>
                `;
            });
            siswaHtml += '</tbody></table>';
        }
        
        trSub.innerHTML = `
            <td colspan="5" style="padding:0;">
                <div class="subtable-container">
                    <h4 style="margin-bottom:0.5rem; font-size:0.95rem; color:#334155;"><i class="fas fa-users" style="color:var(--admin-accent);"></i> Murid Terdaftar (Kelas ${escHtml(k.program)} - ${escHtml(k.hari)})</h4>
                    ${siswaHtml}
                </div>
            </td>
        `;
        tbody.appendChild(trSub);
    });
}

window.toggleExpandKelas = function(idx, btn) {
    const row = document.getElementById(`expand-row-${idx}`);
    if (!row) return;
    if (row.style.display === 'none') {
        row.style.display = 'table-row';
        btn.innerHTML = '<i class="fas fa-chevron-up"></i> Sembunyikan Murid';
    } else {
        row.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-chevron-down"></i> Lihat Daftar Murid';
    }
};

window.viewDetailAbsensiSiswa = function(uid, nama) {
    document.getElementById('modalSiswaNamaTitle').innerHTML = `<i class="fas fa-user-graduate" style="color: var(--admin-accent);"></i> Detail Absensi: ${escHtml(nama)}`;
    document.getElementById('modalSiswaInfoSub').textContent = `UID RFID: ${uid || '-'}`;
    
    const tbodyHistory = document.getElementById('table-modal-siswa-history');
    tbodyHistory.innerHTML = '<tr><td colspan="2" style="text-align:center;">Memuat riwayat...</td></tr>';
    document.getElementById('modalDetailSiswa').classList.add('active');
    
    fetch(`./api/index.php?action=getAttendanceByUID&uid=${encodeURIComponent(uid)}`)
        .then(res => res.json())
        .then(res => {
            tbodyHistory.innerHTML = '';
            if (!res.success || !res.riwayat || res.riwayat.length === 0) {
                tbodyHistory.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#64748b;">Belum ada log absensi terdeteksi.</td></tr>';
            } else {
                res.riwayat.forEach(r => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${escHtml(r.waktu)}</td>
                        <td><span class="status-badge status-active"><i class="fas fa-check-circle"></i> Hadir</span></td>
                    `;
                    tbodyHistory.appendChild(tr);
                });
            }
        })
        .catch(err => {
            console.error(err);
            tbodyHistory.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#ef4444;">Gagal memuat riwayat absensi.</td></tr>';
        });
};

// --- MENU 3: ABSENSI & NOTIFIKASI ---
function initGuruAbsensiPage() {
    // Determine today in Indonesian (e.g. "Senin")
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[new Date().getDay()];
    
    const radioToday = document.querySelector(`input[name="filterHariAbsensi"][value="${todayName}"]`);
    if (radioToday) {
        radioToday.checked = true;
    }
    
    const currentHari = radioToday ? radioToday.value : 'Senin';
    loadSiswaUntukAbsensi(currentHari);
    
    document.querySelectorAll('input[name="filterHariAbsensi"]').forEach(r => {
        r.addEventListener('change', (e) => {
            loadSiswaUntukAbsensi(e.target.value);
        });
    });
    
    const searchBox = document.getElementById('searchAbsensiSiswa');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('#table-input-absensi-siswa tr').forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }
    
    const form = document.getElementById('formSubmitAbsensiMassal');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitAbsensiMassal();
        });
    }
    
    loadAbsensiGuruSelf();
    loadGuruNotifikasi();
}

let globalSiswaAbsensiList = [];

function loadSiswaUntukAbsensi(hari) {
    const tbody = document.getElementById('table-input-absensi-siswa');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data siswa hari ' + escHtml(hari) + '...</td></tr>';
    
    fetch(`./api/index.php?action=getSiswaAbsensiHari&hari=${encodeURIComponent(hari)}`)
        .then(res => res.json())
        .then(res => {
            tbody.innerHTML = '';
            if (!res.success || !res.data || res.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b;">Tidak ada siswa aktif dengan sisa pertemuan &gt; 0 pada hari <strong>${escHtml(hari)}</strong>.</td></tr>`;
                return;
            }
            
            globalSiswaAbsensiList = res.data;
            res.data.forEach((s, i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${escHtml(s.nama)}</td>
                    <td>${escHtml(s.kategori_program)}</td>
                    <td><span class="status-badge status-active">${s.sisa_pertemuan} Pertemuan Sisa</span></td>
                    <td>
                        <label style="margin-right:1rem; cursor:pointer; font-weight:600; color:#059669;">
                            <input type="radio" name="absensi_status_${s.id}" value="Hadir" checked> <i class="fas fa-check-circle"></i> Hadir
                        </label>
                        <label style="cursor:pointer; font-weight:600; color:#dc2626;">
                            <input type="radio" name="absensi_status_${s.id}" value="Tidak Hadir"> <i class="fas fa-times-circle"></i> Tidak Hadir
                        </label>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">Gagal mengambil daftar siswa.</td></tr>';
        });
}

function submitAbsensiMassal() {
    if (globalSiswaAbsensiList.length === 0) {
        alert("Tidak ada siswa untuk diabsen.");
        return;
    }
    
    const absensiItems = [];
    globalSiswaAbsensiList.forEach(s => {
        const checked = document.querySelector(`input[name="absensi_status_${s.id}"]:checked`);
        if (checked) {
            absensiItems.push({
                siswa_id: s.id,
                uid: s.uid,
                nama: s.nama,
                status: checked.value
            });
        }
    });
    
    if (confirm(`Apakah Anda yakin ingin menyimpan absensi untuk ${absensiItems.length} siswa? Sisa pertemuan siswa yang Hadir akan berkurang 1.`)) {
        fetch('./api/index.php?action=submitAbsensiSiswa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ absensi: absensiItems })
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    alert("Berhasil! " + res.message);
                    const selectedHari = document.querySelector('input[name="filterHariAbsensi"]:checked')?.value || 'Senin';
                    loadSiswaUntukAbsensi(selectedHari);
                    loadGuruNotifikasi();
                } else {
                    alert("Gagal menyimpan absensi: " + (res.message || ''));
                }
            })
            .catch(err => {
                console.error(err);
                alert("Terjadi kesalahan sistem saat menyimpan absensi.");
            });
    }
}

function loadAbsensiGuruSelf() {
    const tbody = document.getElementById('table-self-absensi-guru');
    if (!tbody) return;
    
    fetch('./api/index.php?action=getAbsensiGuruSelf')
        .then(res => res.json())
        .then(res => {
            tbody.innerHTML = '';
            if (!res.success || !res.data || res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b;">Belum ada log tap RFID kehadiran Anda.</td></tr>';
                return;
            }
            
            const elTotal = document.getElementById('stat-self-total');
            const elHadir = document.getElementById('stat-self-hadir');
            if (elTotal) elTotal.textContent = res.data.length + ' Hari';
            if (elHadir) elHadir.textContent = res.data.length + ' Hari';
            
            res.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escHtml(item.tanggal)}</td>
                    <td style="font-weight:600;">${escHtml(item.waktu)}</td>
                    <td><span class="status-badge status-active">${escHtml(item.mode || 'ONLINE')}</span></td>
                    <td><span class="status-badge status-active"><i class="fas fa-check-circle"></i> HADIR</span></td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error(err));
}

function loadGuruNotifikasi() {
    const tbody = document.getElementById('table-notif-siswa-full');
    if (!tbody) return;
    
    fetch('./api/index.php?action=getGuruNotifikasi')
        .then(res => res.json())
        .then(res => {
            tbody.innerHTML = '';
            if (!res.success || !res.data || res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Tidak ada notifikasi siswa full pertemuan.</td></tr>';
                return;
            }
            
            res.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escHtml(item.tanggal_notif || '-')}</td>
                    <td style="font-weight:600;">${escHtml(item.nama)}</td>
                    <td>${escHtml(item.kategori_program)}</td>
                    <td><span class="status-badge status-pending" style="background:#fee2e2; color:#ef4444;">${escHtml(item.sisa_pertemuan)} Pertemuan</span></td>
                    <td>
                        <button class="btn-cancel" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#25d366; color:white; border-radius:6px; cursor:pointer;" onclick="copyWaReminder('${escHtml(item.nama)}', '${escHtml(item.kategori_program)}')">
                            <i class="fab fa-whatsapp"></i> Kirim Reminder WA ke Ortu
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error(err));
}

window.copyWaReminder = function(namaSiswa, program) {
    const pesan = `Assalamualaikum Ibu/Bapak,\n\nAnak Anda *${namaSiswa}* telah menyelesaikan sesi belajar program *${program}* di Sempoa SIP TC Pariaman.\n\nStatus Sisa Pertemuan: *0 Pertemuan* (Sudah Penuh).\n\nUntuk melanjutkan kelas anak Anda pada periode berikutnya, mohon dapat melakukan pembayaran perpanjangan SPP.\n\nTerima kasih,\nSempoa SIP TC Pariaman`;
    
    navigator.clipboard.writeText(pesan)
        .then(() => {
            alert(`Pesan pengingat WA untuk siswa "${namaSiswa}" berhasil disalin ke clipboard! Silakan paste di WhatsApp.`);
        })
        .catch(err => {
            console.error(err);
            alert("Gagal menyalin pesan ke clipboard.");
        });
};
