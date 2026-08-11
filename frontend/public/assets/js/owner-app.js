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

        // 1. Dashboard Stats
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
            const total = keuangan.reduce((sum, item) => sum + parseInt(item.nominal || 0), 0);
            statPendapatan.textContent = 'Rp ' + total.toLocaleString('id-ID');
        }

        // 2. Render Recent Siswa Table
        const tbodyRecent = document.getElementById('table-recent-siswa');
        if (tbodyRecent) {
            tbodyRecent.innerHTML = '';
            const recentSiswa = [...siswa].reverse().slice(0, 5);
            recentSiswa.forEach((s) => {
                const tr = document.createElement('tr');
                const badgeClass = s.status === 'Aktif' ? 'status-active' : 'status-pending';
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

        // 3. Render Full Siswa Table
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

        // 4. Render Full Guru Table
        const tbodyGuru = document.getElementById('table-guru');
        if (tbodyGuru) {
            tbodyGuru.innerHTML = '';
            guru.forEach((g, index) => {
                const tr = document.createElement('tr');
                const badgeClass = g.status === 'Aktif' ? 'status-active' : 'status-pending';
                tr.innerHTML = `
                    <td>${escHtml(g.uid || g.id)}</td>
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
            
            const selectGuru = document.getElementById('jadwalGuru');
            if (selectGuru) {
                selectGuru.innerHTML = '<option value="">-- Pilih Guru --</option>';
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
            
            siswa.forEach((s) => {
                const payments = keuangan.filter(k => k.siswaId === s.id);
                const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null;
                
                const tr = document.createElement('tr');
                const badgeClass = s.status_spp === 'LUNAS' || s.status === 'Aktif' ? 'status-active' : 'status-pending';
                const statusText = s.status_spp || (s.status === 'Aktif' ? 'LUNAS' : 'MENUNGGAK');
                
                tr.innerHTML = `
                    <td>${escHtml(s.id)}</td>
                    <td>${escHtml(s.nama)}</td>
                    <td>${escHtml(s.program)}</td>
                    <td><span class="status-badge ${badgeClass}">${escHtml(statusText)}</span></td>
                    <td>${lastPayment ? escHtml(lastPayment.tanggal + ' (' + lastPayment.jenis + ')') : '-'}</td>
                    <td>
                        <button class="btn-cancel" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: var(--admin-primary); color: white;" onclick="openKeuanganModal('${s.id}')">
                            <i class="fas fa-wallet"></i> Kelola SPP
                        </button>
                    </td>
                `;
                tbodyKeuangan.appendChild(tr);
            });
        }
    }

    // --- FORM SUBMIT EVENT HANDLERS ---
    const formSiswa = document.getElementById('formSiswa');
    if (formSiswa) {
        formSiswa.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('siswaId').value;
            const nama = document.getElementById('siswaNama').value.trim();
            const panggilan = document.getElementById('siswaPanggilan').value.trim();
            const email = document.getElementById('siswaEmail').value.trim().toLowerCase() + '@sempoasippariaman.com';
            const password = panggilan;
            const guru = document.getElementById('siswaGuru') ? document.getElementById('siswaGuru').value : '';
            const program = document.getElementById('siswaProgram').value;
            const target = document.getElementById('siswaTarget') ? parseInt(document.getElementById('siswaTarget').value, 10) : 8;
            const statusElem = document.getElementById('siswaStatus');
            const status = statusElem ? statusElem.value : 'Aktif';
            
            let siswa = getSiswa();
            
            if (id) {
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
                        const newSiswa = {
                            id: 'S' + String(siswa.length + 1).padStart(3, '0'),
                            uid: uid || res.uid || '',
                            nama, panggilan, email, password, guru, program, status,
                            tanggal: new Date().toISOString().split('T')[0]
                        };
                        siswa.push(newSiswa);
                        saveSiswa(siswa);
                        alert("Siswa baru berhasil ditambahkan.");
                    } else {
                        alert("Gagal menyimpan siswa ke server: " + (res.message || ''));
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
            const uid = document.getElementById('guruUid').value.trim();
            const nama = document.getElementById('guruNama').value.trim();
            const panggilan = document.getElementById('guruPanggilan').value.trim();
            const email = document.getElementById('guruEmail').value.trim().toLowerCase() + '@sempoasippariaman.com';
            const program = document.getElementById('guruProgram').value;
            
            let guru = getGuru();
            
            if (id) {
                const payload = { id, uid, nama, panggilan, email, program };
                fetch('./api/index.php?action=editPegawai', {
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
                        alert("Gagal menyimpan perubahan ke server: " + (res.message || ''));
                    }
                })
                .catch(err => console.error(err))
                .finally(() => {
                    closeModal('modalGuru');
                    renderData();
                });
            } else {
                const payload = { uid, nama, panggilan, email, program };
                fetch('./api/index.php?action=addPegawai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        const newGuru = {
                            id: 'G' + String(guru.length + 1).padStart(3, '0'),
                            uid, nama, panggilan, email, program, status: 'Aktif'
                        };
                        guru.push(newGuru);
                        saveGuru(guru);
                        alert("Guru baru berhasil ditambahkan.");
                    } else {
                        alert("Gagal menyimpan guru ke server: " + (res.message || ''));
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
            const index = document.getElementById('jadwalIndex').value;
            const id = document.getElementById('jadwalId').value.trim();
            const program = document.getElementById('jadwalProgram').value;
            const guru = document.getElementById('jadwalGuru').value;
            const kapasitas = document.getElementById('jadwalKapasitas').value;
            
            const hariChecked = Array.from(document.querySelectorAll('input[name="jadwalHari"]:checked')).map(cb => cb.value);
            const jamChecked = Array.from(document.querySelectorAll('input[name="jadwalJam"]:checked')).map(cb => cb.value);
            
            const hari = hariChecked.join(', ');
            const jam = jamChecked.join(', ');
            
            let jadwal = getJadwal();
            
            if (index !== '') {
                jadwal[index] = { id, program, guru, hari, jam, kapasitas };
            } else {
                jadwal.push({ id, program, guru, hari, jam, kapasitas });
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
            const siswaId = document.getElementById('bayarSiswaId').value;
            const tanggal = document.getElementById('bayarTanggal').value;
            const jenis = document.getElementById('bayarJenis').value;
            const nominal = document.getElementById('bayarNominal').value;
            
            let keuangan = getKeuangan();
            keuangan.push({
                id: 'TRX' + Date.now(),
                siswaId, tanggal, jenis, nominal
            });
            saveKeuangan(keuangan);
            
            let siswa = getSiswa();
            const sIdx = siswa.findIndex(s => s.id === siswaId);
            if (sIdx > -1) {
                siswa[sIdx].status_spp = 'LUNAS';
                saveSiswa(siswa);
            }
            
            closeModal('modalKeuangan');
            renderData();
            alert("Transaksi pembayaran berhasil dicatat.");
        });
    }

    // Synchronize Database on load
    fetch('./api/index.php?action=getInitialData')
        .then(res => res.json())
        .then(data => {
            if (data.siswa && Array.isArray(data.siswa)) {
                saveSiswa(data.siswa.map(s => ({
                    id: s.id || ('S' + String(s.id).padStart(3, '0')),
                    uid: s.uid || '',
                    nama: s.nama,
                    panggilan: s.nama.split(' ')[0],
                    email: s.email || `${s.nama.split(' ')[0].toLowerCase()}@sempoasippariaman.com`,
                    program: s.kategori_program,
                    status: s.status_spp === 'EXPIRED' ? 'Menunggu' : 'Aktif',
                    status_spp: s.status_spp || 'LUNAS',
                    tanggal: s.created_at ? s.created_at.split(' ')[0] : new Date().toISOString().split('T')[0]
                })));
            }
            if (data.guru && Array.isArray(data.guru)) {
                saveGuru(data.guru.map(g => ({
                    id: g.id || ('G' + String(g.id).padStart(3, '0')),
                    uid: g.uid,
                    nama: g.nama,
                    panggilan: g.nama.split(' ')[0],
                    email: g.email || `${g.nama.split(' ')[0].toLowerCase()}@sempoasippariaman.com`,
                    program: g.kategori_program,
                    status: 'Aktif'
                })));
            }
            renderData();
            initOwnerCharts();
        })
        .catch(err => {
            renderData();
            initOwnerCharts();
        });
});

// --- GLOBAL FUNCTIONS & EXPORTS ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        if (modalId === 'modalSiswa') {
            document.getElementById('siswaId').value = '';
            document.getElementById('formSiswa').reset();
        }
        if (modalId === 'modalGuru') {
            document.getElementById('guruId').value = '';
            document.getElementById('formGuru').reset();
        }
        if (modalId === 'modalJadwal') {
            document.getElementById('jadwalIndex').value = '';
            document.getElementById('formJadwal').reset();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function editSiswa(index) {
    const siswa = JSON.parse(localStorage.getItem('db_siswa'))[index];
    if (!siswa) return;
    document.getElementById('siswaId').value = siswa.id;
    document.getElementById('siswaNama').value = siswa.nama;
    document.getElementById('siswaPanggilan').value = siswa.panggilan || '';
    
    const emailParts = siswa.email ? siswa.email.split('@') : ['', ''];
    document.getElementById('siswaEmail').value = emailParts[0] || '';
    document.getElementById('siswaProgram').value = siswa.program;
    
    const statusElem = document.getElementById('siswaStatus');
    if (statusElem) statusElem.value = siswa.status || 'Aktif';
    
    document.getElementById('modalSiswaTitle').textContent = 'Edit Data Siswa';
    openModal('modalSiswa');
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
    if (!guru) return;
    document.getElementById('guruId').value = guru.id;
    document.getElementById('guruUid').value = guru.uid || '';
    document.getElementById('guruNama').value = guru.nama;
    document.getElementById('guruPanggilan').value = guru.panggilan || '';
    
    const emailParts = guru.email ? guru.email.split('@') : ['', ''];
    document.getElementById('guruEmail').value = emailParts[0] || '';
    document.getElementById('guruProgram').value = guru.program;
    
    document.getElementById('modalGuruTitle').textContent = 'Edit Data Guru';
    openModal('modalGuru');
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
    if (!jadwal) return;
    document.getElementById('jadwalIndex').value = index;
    document.getElementById('jadwalId').value = jadwal.id;
    document.getElementById('jadwalProgram').value = jadwal.program;
    document.getElementById('jadwalGuru').value = jadwal.guru;
    document.getElementById('jadwalKapasitas').value = jadwal.kapasitas;
    
    document.querySelectorAll('input[name="jadwalHari"]').forEach(cb => cb.checked = false);
    if (jadwal.hari) {
        const savedHari = jadwal.hari.split(',').map(h => h.trim());
        document.querySelectorAll('input[name="jadwalHari"]').forEach(cb => {
            if (savedHari.includes(cb.value)) cb.checked = true;
        });
    }

    document.querySelectorAll('input[name="jadwalJam"]').forEach(cb => cb.checked = false);
    if (jadwal.jam) {
        const savedJam = jadwal.jam.split(',').map(j => j.trim());
        document.querySelectorAll('input[name="jadwalJam"]').forEach(cb => {
            if (savedJam.includes(cb.value)) cb.checked = true;
        });
    }
    
    document.getElementById('modalJadwalTitle').textContent = 'Edit Kelas Jadwal';
    openModal('modalJadwal');
}

function deleteJadwal(index) {
    if(confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
        let jadwal = JSON.parse(localStorage.getItem('db_jadwal'));
        jadwal.splice(index, 1);
        localStorage.setItem('db_jadwal', JSON.stringify(jadwal));
        window.location.reload();
    }
}

function openKeuanganModal(siswaId) {
    const siswa = (JSON.parse(localStorage.getItem('db_siswa')) || []).find(s => s.id === siswaId);
    if (!siswa) return;
    
    document.getElementById('bayarSiswaId').value = siswa.id;
    document.getElementById('bayarTanggal').value = new Date().toISOString().split('T')[0];
    
    const infoContainer = document.getElementById('keuanganSiswaInfo');
    if (infoContainer) {
        infoContainer.innerHTML = `
            <strong>Nama Siswa:</strong> ${escHtml(siswa.nama)} (${escHtml(siswa.id)})<br>
            <strong>Program:</strong> ${escHtml(siswa.program)} | <strong>Status SPP:</strong> ${escHtml(siswa.status_spp || 'LUNAS')}
        `;
    }
    
    const tbodyHistory = document.getElementById('table-history-keuangan');
    if (tbodyHistory) {
        tbodyHistory.innerHTML = '';
        const keuangan = (JSON.parse(localStorage.getItem('db_keuangan')) || []).filter(k => k.siswaId === siswaId);
        if (keuangan.length === 0) {
            tbodyHistory.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada riwayat transaksi</td></tr>';
        } else {
            keuangan.forEach(k => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escHtml(k.tanggal)}</td>
                    <td>${escHtml(k.jenis)}</td>
                    <td style="font-weight:600; color:#16a34a;">Rp ${parseInt(k.nominal||0).toLocaleString('id-ID')}</td>
                `;
                tbodyHistory.appendChild(tr);
            });
        }
    }
    
    openModal('modalKeuangan');
}

// --- RESET DATABASE FEATURE (KHUSUS OWNER) ---
window.triggerDatabaseReset = function() {
    const inputElem = document.getElementById('inputResetConfirm');
    const inputVal = inputElem ? inputElem.value.trim() : '';
    
    if (inputVal !== 'CONFIRM_RESET_DATABASE') {
        alert("Konfirmasi gagal! Anda harus mengetikkan 'CONFIRM_RESET_DATABASE' dengan tepat.");
        return;
    }

    if (!confirm("PERINGATAN TERAKHIR!\n\nApakah Anda benar-benar yakin ingin mengosongkan seluruh database?\nSemua data siswa, guru, absensi, dan keuangan akan terhapus secara permanen.")) {
        return;
    }

    fetch('./api/reset.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'CONFIRM_RESET_DATABASE' })
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            alert("BERHASIL! " + res.message);
            localStorage.clear();
            window.location.href = 'portal-owner.php';
        } else {
            alert("Gagal melakukan reset database: " + res.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Terjadi kesalahan sistem saat menghubungkan ke server reset.");
    });
};

// --- OWNER CHART INITIALIZATION ---
function initOwnerCharts() {
    const canvasPemasukan = document.getElementById('chartPemasukan');
    const canvasDistribusi = document.getElementById('chartDistribusi');
    const canvasPertumbuhan = document.getElementById('chartPertumbuhan');

    if (canvasPemasukan && typeof Chart !== 'undefined') {
        new Chart(canvasPemasukan, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                datasets: [{
                    label: 'Pemasukan SPP (Rp)',
                    data: [1500000, 2100000, 1800000, 2400000, 2700000, 3100000, 3500000, 4200000, 3900000, 4500000, 4800000, 5200000],
                    backgroundColor: 'rgba(2, 132, 199, 0.75)',
                    borderColor: '#0284c7',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: v => 'Rp ' + (v / 1000).toLocaleString('id-ID') + 'k' }
                    }
                }
            }
        });
    }

    if (canvasDistribusi && typeof Chart !== 'undefined') {
        new Chart(canvasDistribusi, {
            type: 'doughnut',
            data: {
                labels: ['Sempoa SIP', 'Fonem', 'Tahfidz', 'Bahasa Inggris'],
                datasets: [{
                    data: [45, 25, 15, 15],
                    backgroundColor: ['#ea580c', '#0284c7', '#16a34a', '#9333ea'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    if (canvasPertumbuhan && typeof Chart !== 'undefined') {
        new Chart(canvasPertumbuhan, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'],
                datasets: [
                    {
                        label: 'Total Siswa Aktif',
                        data: [12, 18, 24, 30, 35, 42, 50, 58],
                        borderColor: '#16a34a',
                        backgroundColor: 'rgba(22, 163, 74, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Total Guru',
                        data: [2, 3, 3, 4, 5, 5, 6, 7],
                        borderColor: '#ea580c',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } }
            }
        });
    }
}

// --- EXPORT FUNCTIONS FOR OWNER ---
window.exportSiswaToExcel = function() {
    const siswa = JSON.parse(localStorage.getItem('db_siswa')) || [];
    if (siswa.length === 0) { alert("Tidak ada data siswa untuk diekspor!"); return; }
    
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `"No","ID Siswa","Nama Lengkap","Program","Tanggal Daftar","Status SPP"\r\n`;
    siswa.forEach((s, idx) => {
        csv += `"${idx+1}","${s.id}","${s.nama}","${s.program||'-'}","${s.tanggal||'-'}","${s.status||'Aktif'}"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Data_Siswa_Owner_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

window.exportGuruToExcel = function() {
    const guru = JSON.parse(localStorage.getItem('db_guru')) || [];
    if (guru.length === 0) { alert("Tidak ada data guru untuk diekspor!"); return; }
    
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `"No","UID Kartu","Nama Lengkap","Email","Program Ajar","Status"\r\n`;
    guru.forEach((g, idx) => {
        csv += `"${idx+1}","${g.uid||'-'}","${g.nama}","${g.email||'-'}","${g.program||'-'}","${g.status||'Aktif'}"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Data_Guru_Owner_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

window.exportJadwalToExcel = function() {
    const jadwal = JSON.parse(localStorage.getItem('db_jadwal')) || [];
    if (jadwal.length === 0) { alert("Tidak ada jadwal untuk diekspor!"); return; }
    
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `"No","Kode Kelas","Program","Guru Pengajar","Hari & Jam","Kapasitas"\r\n`;
    jadwal.forEach((j, idx) => {
        csv += `"${idx+1}","${j.id}","${j.program}","${j.guru}","${formatHariRange(j.hari)}, ${formatJamRange(j.jam)}","${j.kapasitas} Siswa"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Jadwal_Kelas_Owner_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

window.exportKeuanganToExcel = function() {
    const keuangan = JSON.parse(localStorage.getItem('db_keuangan')) || [];
    if (keuangan.length === 0) { alert("Belum ada data transaksi keuangan!"); return; }
    
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `"No","ID Transaksi","ID Siswa","Tanggal","Jenis Pembayaran","Nominal (Rp)"\r\n`;
    keuangan.forEach((k, idx) => {
        csv += `"${idx+1}","${k.id}","${k.siswaId}","${k.tanggal}","${k.jenis}","${k.nominal}"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Laporan_Keuangan_Owner_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};
