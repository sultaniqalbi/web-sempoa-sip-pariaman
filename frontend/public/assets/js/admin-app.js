function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
        {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]
    ));
}

function formatJamRange(jamStr) {
    if (!jamStr || typeof jamStr !== 'string') return jamStr || '';
    const rawSlots = jamStr.split(',').map(s => s.trim()).filter(Boolean);
    const parsed = [];
    rawSlots.forEach(slot => {
        const parts = slot.split('-');
        if (parts.length === 2) {
            parsed.push({ start: parts[0].trim(), end: parts[1].trim() });
        } else {
            parsed.push({ raw: slot });
        }
    });

    const valid = parsed.filter(p => p.start && p.end);
    const invalid = parsed.filter(p => p.raw).map(p => p.raw);

    if (valid.length === 0) return jamStr;

    valid.sort((a, b) => a.start.localeCompare(b.start));

    const merged = [];
    let current = null;

    valid.forEach(slot => {
        if (!current) {
            current = { ...slot };
        } else {
            if (current.end === slot.start) {
                current.end = slot.end;
            } else {
                merged.push(current);
                current = { ...slot };
            }
        }
    });
    if (current) {
        merged.push(current);
    }

    const formattedMerged = merged.map(m => `${m.start}-${m.end}`);
    const allFormatted = [...formattedMerged, ...invalid];

    if (allFormatted.length === 1) {
        return allFormatted[0] + ' WIB';
    } else if (allFormatted.length === 2) {
        return allFormatted.join(' dan ') + ' WIB';
    } else {
        const last = allFormatted.pop();
        return allFormatted.join(', ') + ' dan ' + last + ' WIB';
    }
}

function formatHariRange(hariStr) {
    if (!hariStr || typeof hariStr !== 'string') return hariStr || '';
    const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    const rawDays = hariStr.split(',').map(d => d.trim()).filter(Boolean);
    const dayIndexes = [];
    
    rawDays.forEach(d => {
        const idx = DAY_NAMES.findIndex(name => name.toLowerCase() === d.toLowerCase());
        if (idx !== -1 && !dayIndexes.includes(idx)) {
            dayIndexes.push(idx);
        }
    });

    if (dayIndexes.length === 0) return hariStr;

    dayIndexes.sort((a, b) => a - b);

    const groups = [];
    let currentGroup = [dayIndexes[0]];

    for (let i = 1; i < dayIndexes.length; i++) {
        if (dayIndexes[i] === dayIndexes[i - 1] + 1) {
            currentGroup.push(dayIndexes[i]);
        } else {
            groups.push(currentGroup);
            currentGroup = [dayIndexes[i]];
        }
    }
    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }

    const parts = groups.map(g => {
        if (g.length >= 3) {
            return `${DAY_NAMES[g[0]]} - ${DAY_NAMES[g[g.length - 1]]}`;
        } else if (g.length === 2) {
            return `${DAY_NAMES[g[0]]} & ${DAY_NAMES[g[1]]}`;
        } else {
            return DAY_NAMES[g[0]];
        }
    });

    if (parts.length === 1) {
        return parts[0];
    } else if (parts.length === 2) {
        return parts.join(' dan ');
    } else {
        const last = parts.pop();
        return parts.join(', ') + ' dan ' + last;
    }
}



document.addEventListener('DOMContentLoaded', () => {


    // --- CORE CRUD FUNCTIONS ---
    function getSiswa() { return JSON.parse(localStorage.getItem('db_siswa')) || []; }
    function getGuru() { return JSON.parse(localStorage.getItem('db_guru')) || []; }
    function getJadwal() { return JSON.parse(localStorage.getItem('db_jadwal')) || []; }
    function getKeuangan() { return JSON.parse(localStorage.getItem('db_keuangan')) || []; }
    
    function saveSiswa(data) { localStorage.setItem('db_siswa', JSON.stringify(data)); }
    function saveGuru(data) { localStorage.setItem('db_guru', JSON.stringify(data)); }
    function saveJadwal(data) { localStorage.setItem('db_jadwal', JSON.stringify(data)); }
    function saveKeuangan(data) { localStorage.setItem('db_keuangan', JSON.stringify(data)); }

    // --- RENDER FUNCTIONS ---
    function renderData() {
        const siswa = getSiswa();
        const guru = getGuru();

        // 1. Update Dashboard Stats (if on Dashboard)
        const statSiswa = document.getElementById('stat-total-siswa');
        if (statSiswa) {
            statSiswa.textContent = siswa.filter(s => s.status === 'Aktif').length;
        }
        
        const statGuru = document.getElementById('stat-total-guru');
        if (statGuru) {
            statGuru.textContent = guru.length;
        }

        const statKelas = document.getElementById('stat-kelas');
        if (statKelas) {
            const jadwal = getJadwal();
            statKelas.textContent = jadwal.length;
        }

        const statPendapatan = document.getElementById('stat-pendapatan');
        if (statPendapatan) {
            const keuangan = getKeuangan();
            const total = keuangan.reduce((sum, item) => sum + parseInt(item.nominal), 0);
            statPendapatan.textContent = 'Rp ' + total.toLocaleString('id-ID');
        }

        // 2. Render Recent Siswa Table (if on Dashboard)
        const tbodyRecent = document.getElementById('table-recent-siswa');
        if (tbodyRecent) {
            tbodyRecent.innerHTML = '';
            const recentSiswa = [...siswa].reverse().slice(0, 5); // Last 5
            recentSiswa.forEach((s) => {
                const tr = document.createElement('tr');
                const badgeClass = s.status === 'Aktif' ? 'status-active' : 'status-pending';
                // Note: Edit and Delete buttons on dashboard open modal, but we must map them to original index
                const originalIndex = siswa.findIndex(orig => orig.id === s.id);
                tr.innerHTML = `
                    <td>${escHtml(s.nama)}</td>
                    <td>${escHtml(s.program)}</td>
                    <td>${escHtml(s.tanggal)}</td>
                    <td><span class="status-badge ${badgeClass}">${escHtml(s.status)}</span></td>
                    <td>
                        <button class="btn-cancel" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; border: none; background: transparent; cursor:pointer;" onclick="editSiswa(${originalIndex})">
                            <i class="fas fa-edit" style="color: #F57C00;"></i> Edit
                        </button>
                        <button class="btn-cancel" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; border: none; background: transparent; cursor:pointer; color: #ef4444;" onclick="deleteSiswa(${originalIndex})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbodyRecent.appendChild(tr);
            });
        }

        // 3. Render Full Siswa Table (if on admin-siswa.html)
        const tbodySiswa = document.getElementById('table-siswa');
        if (tbodySiswa) {
            tbodySiswa.innerHTML = '';
            siswa.forEach((s, index) => {
                const tr = document.createElement('tr');
                const badgeClass = s.status === 'Aktif' ? 'status-active' : 'status-pending';
                tr.innerHTML = `
                    <td>${escHtml(s.id)}</td>
                    <td>${escHtml(s.nama)}</td>
                    <td>${escHtml(s.program)}</td>
                    <td>${escHtml(s.tanggal)}</td>
                    <td><span class="status-badge ${badgeClass}">${escHtml(s.status)}</span></td>
                    <td>
                        <button class="btn-cancel" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="editSiswa(${index})"><i class="fas fa-edit"></i></button>
                        <button class="btn-cancel" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: #fee2e2; color: #ef4444;" onclick="deleteSiswa(${index})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbodySiswa.appendChild(tr);
            });
        }

        // 4. Render Full Guru Table (if on admin-guru.html)
        const tbodyGuru = document.getElementById('table-guru');
        if (tbodyGuru) {
            tbodyGuru.innerHTML = '';
            guru.forEach((g, index) => {
                const tr = document.createElement('tr');
                const badgeClass = g.status === 'Aktif' ? 'status-active' : 'status-pending';
                tr.innerHTML = `
                    <td>${escHtml(g.id)}</td>
                    <td>${escHtml(g.nama)}</td>
                    <td>${escHtml(g.program)}</td>
                    <td><span class="status-badge ${badgeClass}">${escHtml(g.status)}</span></td>
                    <td>
                        <button class="btn-cancel" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="editGuru(${index})"><i class="fas fa-edit"></i></button>
                        <button class="btn-cancel" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: #fee2e2; color: #ef4444;" onclick="deleteGuru(${index})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbodyGuru.appendChild(tr);
            });
        }

        // 5. Render Jadwal Table
        const tbodyJadwal = document.getElementById('table-jadwal');
        if (tbodyJadwal) {
            tbodyJadwal.innerHTML = '';
            const jadwal = getJadwal();
            jadwal.forEach((j, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escHtml(j.id)}</td>
                    <td>${escHtml(j.program)}</td>
                    <td style="font-weight:600;">${escHtml(j.guru)}</td>
                    <td>${escHtml(formatHariRange(j.hari))}, ${escHtml(formatJamRange(j.jam))}</td>
                    <td>${escHtml(j.kapasitas)} Siswa</td>
                    <td>
                        <button class="btn-cancel" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="editJadwal(${index})"><i class="fas fa-edit"></i></button>
                        <button class="btn-cancel" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: #fee2e2; color: #ef4444;" onclick="deleteJadwal(${index})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbodyJadwal.appendChild(tr);
            });
            
            // Populate Guru Select in Modal
            const selectGuru = document.getElementById('jadwalGuru');
            if (selectGuru) {
                selectGuru.innerHTML = '';
                getGuru().forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g.nama;
                    opt.textContent = g.nama + ' (' + g.program + ')';
                    selectGuru.appendChild(opt);
                });
            }
        }

        // 6. Render Keuangan Table
        const tbodyKeuangan = document.getElementById('table-keuangan');
        if (tbodyKeuangan) {
            tbodyKeuangan.innerHTML = '';
            const keuangan = getKeuangan();
            
            // We group by siswa to show status
            siswa.forEach((s) => {
                // Get all payments for this student
                const payments = keuangan.filter(k => k.siswaId === s.id);
                // Sort by date desc (naive string sort for mock)
                payments.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
                
                const lastPayment = payments.length > 0 ? payments[0] : null;
                const statusSPP = s.status === 'Aktif' ? 'LUNAS' : 'MENUNGGAK';
                const badgeClass = statusSPP === 'LUNAS' ? 'status-active' : 'status-pending';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escHtml(s.id)}</td>
                    <td style="font-weight:600;">${escHtml(s.nama)}</td>
                    <td>${escHtml(s.program)}</td>
                    <td><span class="status-badge ${badgeClass}">${escHtml(statusSPP)}</span></td>
                    <td>${lastPayment ? escHtml(lastPayment.tanggal) + ' ('+escHtml(lastPayment.jenis)+')' : 'Belum Ada'}</td>
                    <td>
                        <button class="btn-primary-admin" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; border-radius: 4px;" onclick="viewKeuangan('${escHtml(s.id)}')"><i class="fas fa-eye"></i> Detail & Bayar</button>
                    </td>
                `;
                tbodyKeuangan.appendChild(tr);
            });
        }
    }

    // --- FORM SUBMISSIONS ---
    const formSiswa = document.getElementById('formSiswa');
    if (formSiswa) {
        formSiswa.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('siswaId').value;
            const nama = document.getElementById('siswaNama').value.trim();
            const panggilan = document.getElementById('siswaPanggilan').value.trim();
            const email = document.getElementById('siswaEmail').value.trim().toLowerCase() + '@sempoasippariaman.com';
            const password = panggilan; // Sandi otomatis dari panggilan
            const guru = document.getElementById('siswaGuru').value;
            const program = document.getElementById('siswaProgram').value;
            const target = document.getElementById('siswaTarget') ? parseInt(document.getElementById('siswaTarget').value, 10) : 8;
            const statusElem = document.getElementById('siswaStatus');
            const status = statusElem ? statusElem.value : 'Aktif';
            
            let siswa = getSiswa();
            
            if (id) {
                // Edit mode (POST to editSiswa, tanpa meng-overwrite password)
                const payload = { id, nama, panggilan, email, guru, program, status, target };
                fetch('./api/index.php?action=editSiswa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        const index = siswa.findIndex(s => s.id === id);
                        if (index > -1) {
                            siswa[index] = { ...siswa[index], ...payload };
                            saveSiswa(siswa);
                        }
                        alert("Data siswa berhasil diperbarui.");
                    } else {
                        alert("Gagal menyimpan perubahan ke server: " + (res.message || ''));
                    }
                })
                .catch(err => console.error(err))
                .finally(() => {
                    closeModal('modalSiswa');
                    renderData();
                });
            } else {
                // Add mode (auto-provisioning dengan password acak)
                const uidInput = document.getElementById('siswaUid');
                const uid = uidInput ? uidInput.value : '';
                const payload = { uid, nama, panggilan, email, guru, program, status, target };
                
                fetch('./api/index.php?action=addSiswa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        payload.id = res.id || ('S' + String(siswa.length + 1).padStart(3, '0'));
                        siswa.push(payload);
                        saveSiswa(siswa);
                        if (res.generated_password) {
                            alert("BERHASIL MENAMBAHKAN SISWA!\n\nEmail Login: " + (res.email || email) + "\nKata Sandi Acak: " + res.generated_password + "\n\nMohon catat kata sandi ini untuk disampaikan kepada siswa/orang tua.");
                        }
                    } else {
                        alert("Gagal menambahkan siswa ke server: " + (res.message || ''));
                    }
                })
                .catch(err => console.error(err))
                .finally(() => {
                    closeModal('modalSiswa');
                    renderData();
                });
            }
        });
    }

    const formGuru = document.getElementById('formGuru');
    if (formGuru) {
        formGuru.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('guruId').value;
            const nama = document.getElementById('guruNama').value.trim();
            const panggilan = document.getElementById('guruPanggilan').value.trim();
            const email = document.getElementById('guruEmail').value.trim().toLowerCase() + '@guru.sempoasip.com';
            const program = document.getElementById('guruProgram').value;
            const statusElem = document.getElementById('guruStatus');
            const status = statusElem ? statusElem.value : 'Aktif';
            
            const hariCheckboxes = document.querySelectorAll('input[name="guruHari"]:checked');
            const hari = Array.from(hariCheckboxes).map(cb => cb.value).join(', ') || 'Senin-Sabtu';
            
            let guru = getGuru();
            
            if (id) {
                // Edit mode
                const payload = { id, nama, panggilan, email, program, hari, status };
                fetch('./api/index.php?action=editGuru', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        const index = guru.findIndex(g => g.id === id);
                        if (index > -1) {
                            guru[index] = { ...guru[index], ...payload };
                            saveGuru(guru);
                        }
                        alert("Data guru berhasil diperbarui.");
                    } else {
                        alert("Gagal menyimpan perubahan guru: " + (res.message || ''));
                    }
                })
                .catch(err => console.error(err))
                .finally(() => {
                    closeModal('modalGuru');
                    renderData();
                });
            } else {
                // Add mode
                const uidInput = document.getElementById('guruUid');
                const uid = uidInput ? uidInput.value : '';
                const payload = { uid, nama, panggilan, email, program, hari, status };

                fetch('./api/index.php?action=addPegawai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        payload.id = res.id || ('G' + String(guru.length + 1).padStart(3, '0'));
                        guru.push(payload);
                        saveGuru(guru);
                        if (res.generated_password) {
                            alert("BERHASIL MENAMBAHKAN GURU!\n\nEmail Login: " + (res.email || email) + "\nKata Sandi Acak: " + res.generated_password + "\n\nMohon catat kata sandi ini untuk disampaikan kepada pengajar.");
                        }
                    } else {
                        alert("Gagal menambahkan guru ke server: " + (res.message || ''));
                    }
                })
                .catch(err => console.error(err))
                .finally(() => {
                    closeModal('modalGuru');
                    renderData();
                });
            }
        });
    }

    const formJadwal = document.getElementById('formJadwal');
    if (formJadwal) {
        formJadwal.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('jadwalId').value;
            const program = document.getElementById('jadwalProgram').value;
            const guruStr = document.getElementById('jadwalGuru').value;
            
            const hariCheckboxes = document.querySelectorAll('input[name="jadwalHari"]:checked');
            const hari = Array.from(hariCheckboxes).map(cb => cb.value).join(', ');
            
            const jamCheckboxes = document.querySelectorAll('input[name="jadwalJam"]:checked');
            const jam = Array.from(jamCheckboxes).map(cb => cb.value).join(', ');
            const kapasitas = document.getElementById('jadwalKapasitas').value;
            
            let jadwal = getJadwal();
            
            if (id) {
                const index = jadwal.findIndex(j => j.id === id);
                if(index > -1) {
                    jadwal[index].program = program;
                    jadwal[index].guru = guruStr;
                    jadwal[index].hari = hari;
                    jadwal[index].jam = jam;
                    jadwal[index].kapasitas = kapasitas;
                }
            } else {
                const newId = 'J' + String(jadwal.length + 1).padStart(3, '0');
                jadwal.push({ id: newId, program, guru: guruStr, hari, jam, kapasitas });
            }
            
            saveJadwal(jadwal);
            closeModal('modalJadwal');
            renderData();
        });
    }

    const formKeuangan = document.getElementById('formKeuangan');
    if (formKeuangan) {
        formKeuangan.addEventListener('submit', function(e) {
            e.preventDefault();
            const sId = document.getElementById('bayarSiswaId').value;
            const tanggal = document.getElementById('bayarTanggal').value; // YYYY-MM-DD
            const jenis = document.getElementById('bayarJenis').value;
            const nominal = document.getElementById('bayarNominal').value;
            
            // Format tanggal to DD MMM YYYY for display
            const d = new Date(tanggal);
            const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            
            let keuangan = getKeuangan();
            const newId = 'K' + String(keuangan.length + 1).padStart(3, '0');
            keuangan.push({ id: newId, siswaId: sId, tanggal: dateStr, jenis, nominal });
            
            // Also update student status to 'Aktif'
            let siswaArr = getSiswa();
            const sIndex = siswaArr.findIndex(s => s.id === sId);
            if (sIndex > -1) {
                siswaArr[sIndex].status = 'Aktif';
                saveSiswa(siswaArr);
            }
            
            saveKeuangan(keuangan);
            
            // Refresh view
            viewKeuangan(sId);
            renderData();
        });
    }

    // 7. Dynamic Guru Dropdown based on Program (Admin Siswa)
    const siswaProgramSelect = document.getElementById('siswaProgram');
    if (siswaProgramSelect) {
        siswaProgramSelect.addEventListener('change', function() {
            const program = this.value;
            const selectGuru = document.getElementById('siswaGuru');
            if (selectGuru) {
                selectGuru.innerHTML = '<option value="">-- Pilih Guru --</option>';
                if (!program) return;
                
                const guruList = JSON.parse(localStorage.getItem('db_guru')) || [];
                guruList.forEach(g => {
                    // Tampilkan guru yang aktif dan sesuai program (atau jika program belum di-set)
                    if (g.status === 'Aktif' && g.program === program) {
                        const opt = document.createElement('option');
                        opt.value = g.id;
                        const panggilan = g.panggilan || g.nama.split(' ')[0];
                        opt.textContent = `${panggilan} (${g.program})`;
                        selectGuru.appendChild(opt);
                    }
                });
            }
        });
    }

    // Inisialisasi Sinkronisasi Real-Time dengan MySQL Database
    Promise.all([
        fetch('./api/index.php?action=getSiswa').then(res => res.json()),
        fetch('./api/index.php?action=getGuru').then(res => res.json())
    ]).then(([resSiswa, resGuru]) => {
        if (resSiswa.success && Array.isArray(resSiswa.data)) {
            // Ubah format key database agar cocok dengan localStorage
            const mappedSiswa = resSiswa.data.map(s => ({
                id: s.id,
                uid: s.uid,
                nama: s.nama,
                panggilan: s.nama.split(' ')[0],
                email: s.email || `${s.nama.split(' ')[0].toLowerCase()}@siswa.sempoasip.com`,
                program: s.kategori_program,
                guru: s.guru_nama || '',
                status: s.status_spp === 'AKTIF' ? 'Aktif' : 'Menunggu',
                tanggal: s.created_at ? s.created_at.split(' ')[0] : new Date().toISOString().split('T')[0],
                bio: s.bio || '',
                foto_profil: s.foto_profil || ''
            }));
            saveSiswa(mappedSiswa);
        }
        if (resGuru.success && Array.isArray(resGuru.data)) {
            const mappedGuru = resGuru.data.map(g => ({
                id: g.id,
                uid: g.uid,
                nama: g.nama,
                panggilan: g.nama.split(' ')[0],
                email: g.email || `${g.nama.split(' ')[0].toLowerCase()}@sempoasip-pariaman.com`,
                program: g.kategori_program,
                status: 'Aktif',
                bio: g.bio || '',
                foto_profil: g.foto_profil || ''
            }));
            saveGuru(mappedGuru);
        }
        renderData();
    }).catch(err => {
        console.error("Gagal menyinkronkan data database ke local storage:", err);
        renderData();
    });
});

// --- GLOBAL FUNCTIONS (Modal & Actions) ---
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    // Clear forms on open if not editing
    if (modalId === 'modalSiswa') {
        document.getElementById('siswaId').value = '';
        const uidInput = document.getElementById('siswaUid');
        if (uidInput) {
            uidInput.value = '';
            uidInput.readOnly = false;
            uidInput.style.background = '#fff';
            uidInput.style.cursor = 'text';
        }
        document.getElementById('formSiswa').reset();
        document.getElementById('modalSiswaTitle').textContent = 'Tambah Siswa Baru';
        // Kosongkan Guru dropdown agar admin memilih program dulu
        const selectGuru = document.getElementById('siswaGuru');
        if(selectGuru) {
            selectGuru.innerHTML = '<option value="">-- Pilih Guru --</option>';
        }
    } else if (modalId === 'modalGuru') {
        document.getElementById('guruId').value = '';
        const uidInput = document.getElementById('guruUid');
        if (uidInput) {
            uidInput.value = '';
            uidInput.readOnly = false;
            uidInput.style.background = '#fff';
            uidInput.style.cursor = 'text';
        }
        document.getElementById('formGuru').reset();
        // Reset hari checkboxes
        document.querySelectorAll('input[name="guruHari"]').forEach(cb => cb.checked = false);
        document.getElementById('modalGuruTitle').textContent = 'Tambah Guru';
    } else if (modalId === 'modalJadwal') {
        document.getElementById('jadwalId').value = '';
        document.getElementById('formJadwal').reset();
        document.getElementById('modalJadwalTitle').textContent = 'Tambah Jadwal Kelas';
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function editSiswa(index) {
    const siswa = JSON.parse(localStorage.getItem('db_siswa'))[index];
    document.getElementById('siswaId').value = siswa.id;
    document.getElementById('siswaNama').value = siswa.nama;
    const uidInput = document.getElementById('siswaUid');
    if (uidInput) {
        uidInput.value = siswa.uid || '';
        uidInput.readOnly = true;
        uidInput.style.background = '#f8fafc';
        uidInput.style.cursor = 'not-allowed';
    }
    document.getElementById('siswaPanggilan').value = siswa.panggilan || '';
    
    // Email stored has domain, we just show the username part in the form
    const emailParts = siswa.email ? siswa.email.split('@') : ['', ''];
    document.getElementById('siswaEmail').value = emailParts[0] || '';
    
    document.getElementById('siswaProgram').value = siswa.program;
    const statusElem = document.getElementById('siswaStatus');
    if (statusElem) statusElem.value = siswa.status || 'Aktif';
    
    document.getElementById('modalSiswaTitle').textContent = 'Edit Data Siswa';
    
    // Populate dropdown first before setting value
    const selectGuru = document.getElementById('siswaGuru');
    if(selectGuru) {
        selectGuru.innerHTML = '<option value="">-- Pilih Guru --</option>';
        const guruList = JSON.parse(localStorage.getItem('db_guru')) || [];
        guruList.forEach(g => {
            if ((g.status === 'Aktif' && g.program === siswa.program) || g.id === siswa.guru) {
                const opt = document.createElement('option');
                opt.value = g.id;
                const panggilan = g.panggilan || g.nama.split(' ')[0];
                opt.textContent = `${panggilan} (${g.program})`;
                selectGuru.appendChild(opt);
            }
        });
        selectGuru.value = siswa.guru || '';
    }
    
    document.getElementById('modalSiswa').classList.add('active');
}

function deleteSiswa(index) {
    if(confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
        const siswa = JSON.parse(localStorage.getItem('db_siswa'));
        const targetSiswa = siswa[index];
        if (!targetSiswa) return;
        
        fetch('./api/index.php?action=deleteSiswa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: targetSiswa.id, uid: targetSiswa.uid })
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                siswa.splice(index, 1);
                localStorage.setItem('db_siswa', JSON.stringify(siswa));
            } else {
                alert("Gagal menghapus siswa dari server: " + (res.message || ''));
            }
        })
        .catch(e => console.error(e))
        .finally(() => {
            window.location.reload();
        });
    }
}

function editGuru(index) {
    const guru = JSON.parse(localStorage.getItem('db_guru'))[index];
    document.getElementById('guruId').value = guru.id;
    document.getElementById('guruNama').value = guru.nama;
    const uidInput = document.getElementById('guruUid');
    if (uidInput) {
        uidInput.value = guru.uid || '';
        uidInput.readOnly = true;
        uidInput.style.background = '#f8fafc';
        uidInput.style.cursor = 'not-allowed';
    }
    document.getElementById('guruPanggilan').value = guru.panggilan || '';
    
    const emailParts = guru.email ? guru.email.split('@') : ['', ''];
    document.getElementById('guruEmail').value = emailParts[0] || '';
    
    document.getElementById('guruProgram').value = guru.program;
    const statusElem = document.getElementById('guruStatus');
    if (statusElem) statusElem.value = guru.status || 'Aktif';
    
    // Reset and set checkboxes for Hari Mengajar
    const checkboxes = document.querySelectorAll('input[name="guruHari"]');
    checkboxes.forEach(cb => cb.checked = false);
    if (guru.hari) {
        const savedHari = guru.hari.split(',').map(h => h.trim());
        checkboxes.forEach(cb => {
            if (savedHari.includes(cb.value)) cb.checked = true;
        });
    }

    document.getElementById('modalGuruTitle').textContent = 'Edit Data Guru';
    document.getElementById('modalGuru').classList.add('active');
}

function deleteGuru(index) {
    if(confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
        const guru = JSON.parse(localStorage.getItem('db_guru'));
        const targetGuru = guru[index];
        if (!targetGuru) return;
        
        fetch('./api/index.php?action=deletePegawai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: targetGuru.id, uid: targetGuru.uid })
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                guru.splice(index, 1);
                localStorage.setItem('db_guru', JSON.stringify(guru));
            } else {
                alert("Gagal menghapus guru dari server: " + (res.message || ''));
            }
        })
        .catch(e => console.error(e))
        .finally(() => {
            window.location.reload();
        });
    }
}

function editJadwal(index) {
    const jadwal = JSON.parse(localStorage.getItem('db_jadwal'))[index];
    document.getElementById('jadwalId').value = jadwal.id;
    document.getElementById('jadwalProgram').value = jadwal.program;
    document.getElementById('jadwalGuru').value = jadwal.guru;
    
    // Reset and set checkboxes for Hari Mengajar
    const hariCheckboxes = document.querySelectorAll('input[name="jadwalHari"]');
    hariCheckboxes.forEach(cb => cb.checked = false);
    if (jadwal.hari) {
        const savedHari = jadwal.hari.split(',').map(h => h.trim());
        hariCheckboxes.forEach(cb => {
            if (savedHari.includes(cb.value)) cb.checked = true;
        });
    }

    // Reset and set checkboxes for Jam Mengajar
    const jamCheckboxes = document.querySelectorAll('input[name="jadwalJam"]');
    jamCheckboxes.forEach(cb => cb.checked = false);
    if (jadwal.jam) {
        const savedJam = jadwal.jam.split(',').map(j => j.trim());
        jamCheckboxes.forEach(cb => {
            if (savedJam.includes(cb.value)) cb.checked = true;
        });
    }

    document.getElementById('jadwalKapasitas').value = jadwal.kapasitas;
    document.getElementById('modalJadwalTitle').textContent = 'Edit Jadwal Kelas';
    document.getElementById('modalJadwal').classList.add('active');
}

function deleteJadwal(index) {
    if(confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
        const jadwal = JSON.parse(localStorage.getItem('db_jadwal'));
        jadwal.splice(index, 1);
        localStorage.setItem('db_jadwal', JSON.stringify(jadwal));
        window.location.reload();
    }
}

// --- FITUR NOTIFIKASI ---
window.toggleNotif = function() {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
};

function viewKeuangan(sId) {
    const siswa = JSON.parse(localStorage.getItem('db_siswa')).find(s => s.id === sId);
    if (!siswa) return;
    
    document.getElementById('modalKeuanganTitle').textContent = 'Riwayat Pembayaran: ' + siswa.nama;
    document.getElementById('modalKeuanganSubtitle').textContent = 'ID Siswa: ' + sId + ' | Program: ' + siswa.program;
    document.getElementById('bayarSiswaId').value = sId;
    
    // Reset form
    document.getElementById('bayarJenis').value = 'SPP Bulanan';
    document.getElementById('bayarNominal').value = '150000';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bayarTanggal').value = today;
    
    // Render Riwayat Pembayaran in Modal
    const keuangan = JSON.parse(localStorage.getItem('db_keuangan')) || [];
    const payments = keuangan.filter(k => k.siswaId === sId);
    payments.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    const tbody = document.getElementById('table-riwayat-pembayaran');
    tbody.innerHTML = '';
    
    if(payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada riwayat pembayaran.</td></tr>';
    } else {
        payments.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escHtml(p.tanggal)}</td>
                <td>${escHtml(p.jenis)}</td>
                <td style="font-weight:bold;">Rp ${parseInt(p.nominal).toLocaleString('id-ID')}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    document.getElementById('modalKeuangan').classList.add('active');
}

// --- FITUR RIWAYAT ABSENSI & EXCEL EXPORT ---
let globalRiwayatData = [];

window.renderRiwayat = function() {
    fetch('./api/get_riwayat.php')
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                globalRiwayatData = data.data; // Simpan untuk fungsi export
                
                const tbodySiswa = document.getElementById('table-riwayat-siswa');
                const tbodyGuru = document.getElementById('table-riwayat-guru');
                
                if(!tbodySiswa && !tbodyGuru) return; // Jika bukan di halaman riwayat
                
                if(tbodySiswa) tbodySiswa.innerHTML = '';
                if(tbodyGuru) tbodyGuru.innerHTML = '';
                
                let countSiswa = 0;
                let countGuru = 0;
                
                data.data.forEach(item => {
                    const tr = document.createElement('tr');
                    // Kolom: UID, Nama Lengkap, Waktu
                    tr.innerHTML = `
                        <td>${escHtml(item.uid || '-')}</td>
                        <td style="font-weight:600;">${escHtml(item.nama)}</td>
                        <td>${escHtml(item.waktu)}</td>
                    `;
                    
                    if (item.tipe === 'Siswa') {
                        if(tbodySiswa) tbodySiswa.appendChild(tr);
                        countSiswa++;
                    } else if (item.tipe === 'Guru') {
                        if(tbodyGuru) tbodyGuru.appendChild(tr);
                        countGuru++;
                    } else {
                        // Jika Belum Terdaftar, masukkan ke Siswa sebagai default
                        if(tbodySiswa) {
                            tr.innerHTML = `
                                <td>${escHtml(item.uid || '-')}</td>
                                <td style="font-weight:600; color:#ef4444;">${escHtml(item.nama)} (Tidak Dikenal)</td>
                                <td>${escHtml(item.waktu)}</td>
                            `;
                            tbodySiswa.appendChild(tr);
                            countSiswa++;
                        }
                    }
                });
                
                if(tbodySiswa && countSiswa === 0) {
                    tbodySiswa.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada riwayat absensi murid.</td></tr>';
                }
                
                if(tbodyGuru && countGuru === 0) {
                    tbodyGuru.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada riwayat absensi guru.</td></tr>';
                }
            }
        })
        .catch(err => console.error(err));
};

window.downloadExcel = function(tipe = 'semua') {
    if(globalRiwayatData.length === 0) {
        alert("Tidak ada data untuk didownload!");
        return;
    }
    
    // Filter data berdasarkan tipe ('siswa', 'guru', atau 'semua')
    let filteredData = globalRiwayatData;
    let judul = "REKAPITULASI ABSENSI SEMPOA SIP TC PARIAMAN";
    
    if (tipe === 'siswa') {
        filteredData = globalRiwayatData.filter(d => d.tipe === 'Siswa' || d.tipe === 'Belum Terdaftar');
        judul = "REKAPITULASI ABSENSI MURID - SEMPOA SIP TC PARIAMAN";
    } else if (tipe === 'guru') {
        filteredData = globalRiwayatData.filter(d => d.tipe === 'Guru');
        judul = "REKAPITULASI ABSENSI GURU - SEMPOA SIP TC PARIAMAN";
    }
    
    if (filteredData.length === 0) {
        alert("Tidak ada data absensi untuk kategori ini.");
        return;
    }

    // Siapkan array data untuk Excel (Header)
    const excelData = [
        [judul],
        ["Tanggal Unduh: " + new Date().toLocaleString('id-ID')],
        [],
        ["No", "Waktu Absen", "UID Kartu", "Nama Lengkap", "Kategori/Tipe"]
    ];
    
    // Isi baris data
    filteredData.forEach((item, index) => {
        excelData.push([
            index + 1,
            item.waktu,
            item.uid || "-",
            item.nama,
            item.tipe
        ]);
    });
    
    // Convert array ke format CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    excelData.forEach(rowArray => {
        let row = rowArray.map(item => `"${item}"`).join(",");
        csvContent += row + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Absensi_${tipe}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
};

// --- EKSPORE EXCEL (CSV) UNTUK SISWA, GURU, JADWAL, DAN KEUANGAN ---
window.exportSiswaToExcel = function() {
    const siswa = JSON.parse(localStorage.getItem('db_siswa')) || [];
    if (siswa.length === 0) { alert("Tidak ada data siswa untuk diekspor!"); return; }
    
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `"No","UID Kartu","Nama Lengkap","Program","Guru Pengajar","Tanggal Daftar","Status SPP"\r\n`;
    siswa.forEach((s, idx) => {
        csv += `"${idx+1}","${s.uid||'-'}","${s.nama}","${s.program||'-'}","${s.guru||'-'}","${s.tanggal||'-'}","${s.status||'Aktif'}"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Data_Siswa_SempoaSIP_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

window.exportGuruToExcel = function() {
    const guru = JSON.parse(localStorage.getItem('db_guru')) || [];
    if (guru.length === 0) { alert("Tidak ada data guru untuk diekspor!"); return; }
    
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `"No","UID Kartu","Nama Lengkap","Nama Panggilan","Email","Program Ajar","Status"\r\n`;
    guru.forEach((g, idx) => {
        csv += `"${idx+1}","${g.uid||'-'}","${g.nama}","${g.panggilan||'-'}","${g.email||'-'}","${g.program||'-'}","${g.status||'Aktif'}"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Data_Guru_SempoaSIP_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

window.exportJadwalToExcel = function() {
    const jadwal = JSON.parse(localStorage.getItem('db_jadwal')) || [];
    if (jadwal.length === 0) { alert("Tidak ada data jadwal untuk diekspor!"); return; }
    
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `"No","ID Kelas","Program","Guru Pengajar","Hari Masuk","Jam / Sesi","Kapasitas"\r\n`;
    jadwal.forEach((j, idx) => {
        csv += `"${idx+1}","${j.id}","${j.program}","${j.guru}","${j.hari}","${j.jam}","${j.kapasitas} Siswa"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Jadwal_Kelas_SempoaSIP_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

window.exportKeuanganToExcel = function() {
    const keuangan = JSON.parse(localStorage.getItem('db_keuangan')) || [];
    const siswa = JSON.parse(localStorage.getItem('db_siswa')) || [];
    if (keuangan.length === 0 && siswa.length === 0) { alert("Tidak ada data keuangan untuk diekspor!"); return; }
    
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `"No","ID Transaksi","Nama Siswa","Jenis Pembayaran","Tanggal","Nominal (Rp)"\r\n`;
    keuangan.forEach((k, idx) => {
        const s = siswa.find(x => x.id === k.siswaId);
        const namaSiswa = s ? s.nama : k.siswaId;
        csv += `"${idx+1}","${k.id}","${namaSiswa}","${k.jenis}","${k.tanggal}","${k.nominal}"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Laporan_Keuangan_SempoaSIP_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

// === FITUR D: ADMIN REMINDER & VERIFIKASI PEMBAYARAN ===

window.loadAdminPendingPayments = function() {
    const tbody = document.getElementById('table-admin-pending-payments');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat data bukti transfer...</td></tr>';
    
    fetch('./api/index.php?action=getAdminPendingPayments')
        .then(res => res.json())
        .then(res => {
            tbody.innerHTML = '';
            if (!res.success || !res.data || res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Tidak ada unggahan bukti transfer yang menunggu verifikasi.</td></tr>';
                return;
            }
            
            res.data.forEach(b => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escHtml(b.created_at)}</td>
                    <td style="font-weight:600;">${escHtml(b.nama_siswa)} (${escHtml(b.kategori_program)})</td>
                    <td><a href="${escHtml(b.file_path)}" target="_blank" style="color:var(--admin-accent); font-weight:600;"><i class="fas fa-file-image"></i> Periksa Bukti</a></td>
                    <td>${escHtml(b.admin_note || '-')}</td>
                    <td>
                        <button class="btn-primary-admin" style="padding:0.3rem 0.6rem; font-size:0.8rem; background:#10b981; border-color:#10b981; margin-right:0.3rem;" onclick="approveBuktiTransfer(${b.bukti_id})">
                            <i class="fas fa-check"></i> Setujui (+8)
                        </button>
                        <button class="btn-cancel" style="padding:0.3rem 0.6rem; font-size:0.8rem; background:#fee2e2; color:#ef4444;" onclick="rejectBuktiTransfer(${b.bukti_id})">
                            <i class="fas fa-times"></i> Tolak
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Gagal memuat bukti transfer.</td></tr>';
        });
};

window.loadAdminReminderList = function() {
    const tbody = document.getElementById('table-admin-reminder-siswa');
    if (!tbody) return;
    
    const filterElem = document.getElementById('filterReminderStatus');
    const filter = filterElem ? filterElem.value : 'semua';
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Memuat data siswa...</td></tr>';
    
    fetch(`./api/index.php?action=getAdminReminderList&filter=${encodeURIComponent(filter)}`)
        .then(res => res.json())
        .then(res => {
            tbody.innerHTML = '';
            if (!res.success || !res.data || res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748b;">Tidak ada data siswa yang cocok dengan filter.</td></tr>';
                return;
            }
            
            res.data.forEach(s => {
                const tr = document.createElement('tr');
                const badgeClass = s.sisa_pertemuan > 2 ? 'status-active' : 'status-pending';
                const statusSPPClass = s.status_spp === 'AKTIF' ? 'status-active' : 'status-pending';
                
                tr.innerHTML = `
                    <td style="font-weight:600;">${escHtml(s.nama)}</td>
                    <td>${escHtml(s.kategori_program)}</td>
                    <td><span class="status-badge ${badgeClass}">${s.sisa_pertemuan} / ${s.target_pertemuan || 8} Pertemuan</span></td>
                    <td><span class="status-badge ${statusSPPClass}">${escHtml(s.status_spp || 'EXPIRED')}</span></td>
                    <td><span class="status-badge ${s.status_pembayaran === 'LUNAS' ? 'status-active' : 'status-pending'}">${escHtml(s.status_pembayaran || 'MENUNGGAK')}</span></td>
                    <td>
                        <button class="btn-primary-admin" style="padding:0.35rem 0.7rem; font-size:0.82rem; background:#25d366; border-color:#25d366;" onclick="openWaReminderModal('${escHtml(s.nama_ortu || 'Orang Tua')}', '${escHtml(s.nama)}', '${escHtml(s.kategori_program)}', ${s.sisa_pertemuan}, ${s.target_pertemuan || 8}, ${s.nominal || 150000}, '${escHtml(s.rekening_nomor)}', '${escHtml(s.rekening_nama)}', '${escHtml(s.rekening_bank)}')">
                            <i class="fab fa-whatsapp"></i> Kirim Reminder WA
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444;">Gagal memuat data reminder.</td></tr>';
        });
};

window.openWaReminderModal = function(namaOrtu, namaSiswa, program, sisa, total, nominal, norek, an, bank) {
    const formattedNominal = parseInt(nominal || 150000).toLocaleString('id-ID');
    const template = `Assalamualaikum Ibu/Bapak ${namaOrtu},\n\nAnak Anda *${namaSiswa}* telah menyelesaikan sesi belajar program *${program}* di Sempoa SIP TC Pariaman.\nSisa pertemuan: *${sisa} / ${total}*\n\nUntuk melanjutkan kelas bimbingan, mohon lakukan pembayaran perpanjangan SPP:\n💰 Nominal: *Rp ${formattedNominal}*\n🏦 Rekening: *${norek}* a.n. *${an}*\n🏧 Bank: *${bank}*\n\nTerima kasih,\nSempoa SIP TC Pariaman`;
    
    document.getElementById('waMessageContent').textContent = template;
    document.getElementById('modalWaReminder').classList.add('active');
};

window.copyWaTextToClipboard = function() {
    const text = document.getElementById('waMessageContent').textContent;
    navigator.clipboard.writeText(text)
        .then(() => {
            alert("Berhasil menyalin draf pesan WhatsApp ke clipboard! Silakan paste di aplikasi WhatsApp.");
            document.getElementById('modalWaReminder').classList.remove('active');
        })
        .catch(err => {
            console.error(err);
            alert("Gagal menyalin pesan.");
        });
};

window.approveBuktiTransfer = function(buktiId) {
    if (confirm("Apakah Anda yakin ingin MENYETUJUI bukti transfer ini? Kuota siswa akan otomatis ditambah +8 pertemuan.")) {
        const note = prompt("Catatan admin untuk persetujuan ini (opsional):", "Transfer diverifikasi sah oleh Admin.");
        fetch('./api/index.php?action=verifikasiBuktiTransfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bukti_id: buktiId, aksi: 'approved', admin_note: note || '' })
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    alert("Berhasil! " + res.message);
                    loadAdminPendingPayments();
                    loadAdminReminderList();
                } else {
                    alert("Gagal memverifikasi: " + (res.message || ''));
                }
            })
            .catch(err => {
                console.error(err);
                alert("Terjadi kesalahan sistem saat memverifikasi bukti transfer.");
            });
    }
};

window.rejectBuktiTransfer = function(buktiId) {
    const note = prompt("Alasan penolakan bukti transfer ini:", "Nominal transfer tidak sesuai / gambar tidak terbaca.");
    if (note !== null) {
        fetch('./api/index.php?action=verifikasiBuktiTransfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bukti_id: buktiId, aksi: 'rejected', admin_note: note })
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    alert("Berhasil! Bukti transfer ditolak.");
                    loadAdminPendingPayments();
                    loadAdminReminderList();
                } else {
                    alert("Gagal menolak bukti transfer: " + (res.message || "Kesalahan tidak diketahui"));
                }
            })
            .catch(err => {
                console.error(err);
                alert("Terjadi kesalahan sistem saat menolak bukti transfer.");
            });
    }
};

// === ABSENSI GURU (FITUR F) ===

let globalRekapGuruData = [];

window.loadRekapAbsensiGuru = function() {
    const tbody = document.getElementById('tbody-rekap-absensi-guru');
    if (!tbody) return;
    
    const bulanElem = document.getElementById('filterBulanGuru');
    const bulan = bulanElem ? bulanElem.value : new Date().toISOString().slice(0,7);
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat rekap absensi guru...</td></tr>';
    
    fetch(`./api/index.php?action=getAbsensiGuruByBulan&bulan=${encodeURIComponent(bulan)}`)
        .then(res => res.json())
        .then(res => {
            tbody.innerHTML = '';
            if (!res.success || !res.data || res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Belum ada log kehadiran guru pada bulan ini.</td></tr>';
                globalRekapGuruData = [];
                return;
            }
            
            globalRekapGuruData = res.data;
            res.data.forEach(g => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${escHtml(g.nama)}</td>
                    <td>${escHtml(g.tanggal)}</td>
                    <td>${escHtml(g.hari)}</td>
                    <td style="font-weight:600;">${escHtml(g.jam_masuk)}</td>
                    <td><span class="status-badge status-active"><i class="fas fa-check-circle"></i> Hadir</span></td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Gagal memuat rekap absensi guru.</td></tr>';
        });
};

window.loadRiwayatTapGuru = function() {
    const tbody = document.getElementById('tbody-riwayat-tap-guru');
    if (!tbody) return;
    
    const dateElem = document.getElementById('filterTanggalGuru');
    const tanggal = dateElem ? dateElem.value : new Date().toISOString().slice(0,10);
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat riwayat tap harian...</td></tr>';
    
    fetch(`./api/index.php?action=getAbsensiGuruByTanggal&tanggal=${encodeURIComponent(tanggal)}`)
        .then(res => res.json())
        .then(res => {
            tbody.innerHTML = '';
            if (!res.success || !res.data || res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b;">Belum ada log tap RFID guru pada tanggal ini.</td></tr>';
                return;
            }
            
            res.data.forEach(g => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${escHtml(g.nama)}</td>
                    <td style="font-weight:600;">${escHtml(g.jam_masuk)}</td>
                    <td><span class="status-badge status-active">${escHtml(g.mode || 'ONLINE')}</span></td>
                    <td><span class="status-badge status-active"><i class="fas fa-check-circle"></i> Hadir</span></td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">Gagal memuat riwayat tap.</td></tr>';
        });
};

window.exportRekapGuruToExcel = function() {
    if (!globalRekapGuruData || globalRekapGuruData.length === 0) {
        alert("Tidak ada data rekap absensi guru untuk diekspor!");
        return;
    }
    
    const bulanElem = document.getElementById('filterBulanGuru');
    const bulan = bulanElem ? bulanElem.value : 'Periode';
    
    if (typeof XLSX !== 'undefined') {
        const excelData = globalRekapGuruData.map(item => ({
            "Nama Guru": item.nama,
            "Tanggal": item.tanggal,
            "Hari": item.hari,
            "Jam Masuk (HH:MM:SS)": item.jam_masuk,
            "Status Kehadiran": item.status
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Presensi Guru");
        XLSX.writeFile(workbook, `Rekap_Absensi_Guru_${bulan}.xlsx`);
    } else {
        let csv = "data:text/csv;charset=utf-8,\uFEFF";
        csv += `"Nama Guru","Tanggal","Hari","Jam Masuk (HH:MM:SS)","Status Kehadiran"\r\n`;
        globalRekapGuruData.forEach(g => {
            csv += `"${g.nama}","${g.tanggal}","${g.hari}","${g.jam_masuk}","${g.status}"\r\n`;
        });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csv));
        link.setAttribute("download", `Rekap_Absensi_Guru_${bulan}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }
};



