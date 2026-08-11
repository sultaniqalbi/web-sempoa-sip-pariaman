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
    <title>Galeri Kegiatan - Sempoa SIP TC Pariaman</title>
    <link rel="stylesheet" href="src/css/style-admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .galeri-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            margin-top: 1.5rem;
        }
        
        .upload-section {
            display: flex;
            gap: 2rem;
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        .upload-form {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .preview-section {
            width: 300px;
            border-left: 1px solid #eee;
            padding-left: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .form-group input {
            width: 100%; padding: 0.8rem; border: 1px solid var(--admin-border);
            border-radius: 8px; font-family: inherit; font-size: 0.95rem;
        }
        
        /* Grid styling */
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            margin-top: 2rem;
        }

        .gallery-item {
            background: white;
            border-radius: 14px;
            overflow: hidden;
            border: 3px solid #f57c00;
            box-shadow: 0 6px 18px rgba(245, 124, 0, 0.12);
            display: flex;
            flex-direction: column;
            position: relative;
            transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.35s ease;
        }

        .gallery-item:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 14px 28px rgba(245, 124, 0, 0.22);
            border-color: #e65100;
        }

        .gallery-img-wrap {
            width: 100%;
            aspect-ratio: 3 / 4;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .gallery-img-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .gallery-item:hover .gallery-img-wrap img {
            transform: scale(1.08);
        }
        
        .gallery-img-wrap i {
            font-size: 3rem;
            color: #ddd;
        }

        .gallery-caption {
            padding: 1.1rem 1rem;
            text-align: center;
            font-weight: 700;
            color: #e65100;
            font-size: 0.92rem;
            min-height: 3.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border-top: 2px solid #fff3e0;
            line-height: 1.4;
        }

        .btn-delete {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            background: #ef4444;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: 0.3s;
        }

        .gallery-item:hover .btn-delete {
            opacity: 1;
        }

        @media (max-width: 992px) {
            .upload-section { flex-direction: column; }
            .preview-section { width: 100%; border-left: none; border-top: 1px solid #eee; padding-left: 0; padding-top: 2rem; }
            .gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 576px) {
            .gallery-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

    <aside class="admin-sidebar">
        <div class="sidebar-header">
            <img src="public/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP">
            <h2><?php echo $user['role'] === 'owner' ? 'Hai Owner' : 'Admin Portal'; ?></h2>
        </div>
        <ul class="sidebar-menu">
            <?php if ($user['role'] === 'owner'): ?>
                <li><a href="portal-owner.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
                <li><a href="owner-siswa.php"><i class="fas fa-users"></i> Data Siswa</a></li>
                <li><a href="owner-guru.php"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
                <li><a href="admin-absensi-guru.php"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
                <li><a href="owner-jadwal.php"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
                <li><a href="owner-keuangan.php"><i class="fas fa-coins"></i> Keuangan</a></li>
                <li><a href="owner-riwayat.php"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
                <li><a href="admin-galeri.php" class="active"><i class="fas fa-images"></i> Galeri Kegiatan</a></li>
            <?php else: ?>
                <li><a href="portal-admin.php"><i class="fas fa-chart-pie"></i> Dashboard</a></li>
                <li><a href="admin-siswa.php"><i class="fas fa-users"></i> Data Siswa</a></li>
                <li><a href="admin-guru.php"><i class="fas fa-chalkboard-teacher"></i> Data Guru</a></li>
                <li><a href="admin-absensi-guru.php"><i class="fas fa-user-clock"></i> Absensi Guru</a></li>
                <li><a href="admin-jadwal.php"><i class="fas fa-calendar-alt"></i> Jadwal & Kelas</a></li>
                <li><a href="admin-pembayaran.php"><i class="fas fa-receipt"></i> Reminder SPP</a></li>
                <li><a href="admin-riwayat.php"><i class="fas fa-history"></i> Riwayat Absensi</a></li>
                <li><a href="admin-galeri.php" class="active"><i class="fas fa-images"></i> Galeri Kegiatan</a></li>
            <?php endif; ?>
        </ul>
        <div class="sidebar-footer">
            <a href="beranda.html" class="btn-logout" onclick="localStorage.clear();"><i class="fas fa-sign-out-alt"></i> Keluar</a>
        </div>
    </aside>

    <main class="admin-main">
        <header class="admin-header">
            <div class="header-search">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Cari foto galeri...">
            </div>
            <div class="header-profile">
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
                <h1>Galeri Kegiatan & Prestasi</h1>
                <p>Kelola foto-foto yang akan ditampilkan di halaman publik website.</p>
            </div>

            <div class="galeri-container">
                
                <!-- UPLOAD SECTION -->
                <div class="upload-section">
                    <form id="uploadForm" class="upload-form">
                        <h3><i class="fas fa-upload" style="color: var(--color-primary-orange); margin-right: 0.5rem;"></i> Upload Foto Baru</h3>
                        <div class="form-group">
                            <label>File Foto</label>
                            <input type="file" id="fotoInput" accept="image/*" required>
                            <small style="color: #666; margin-top: 0.3rem; display: block;">Format: JPG, PNG. Ukuran maksimal 2MB. Rekomendasi rasio kotak (1:1).</small>
                        </div>
                        <div class="form-group">
                            <label>Judul Foto</label>
                            <input type="text" id="judulInput" placeholder="Contoh: Kegiatan Pembelajaran Sempoa" required>
                        </div>
                        <button type="submit" class="btn-primary-admin" style="margin-top: 1rem;">
                            <i class="fas fa-save"></i> Upload & Simpan
                        </button>
                    </form>

                    <div class="preview-section">
                        <h4 style="margin-bottom: 1rem; color: #555;">Live Preview</h4>
                        <div class="gallery-item" style="width: 100%; max-width: 250px;">
                            <div class="gallery-img-wrap">
                                <img id="previewImage" src="" style="display: none;">
                                <i class="fas fa-image" id="previewIcon"></i>
                            </div>
                            <div class="gallery-caption" id="previewText">
                                Teks akan muncul di sini
                            </div>
                        </div>
                    </div>
                </div>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 1rem 0;">
                
                <h3>Semua Galeri</h3>
                <div id="galleryGrid" class="gallery-grid">
                    <!-- Loaded via JS -->
                </div>
                
            </div>
        </div>
    </main>

    <!-- EDIT MODAL -->
    <div id="editModal" style="display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5); z-index: 999; justify-content: center; align-items: center;">
        <div style="background: white; border-radius: 16px; padding: 2rem; max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0; color: #f57c00;"><i class="fas fa-edit"></i> Edit Galeri & Teks</h3>
                <button type="button" onclick="closeEditModal()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #666;">&times;</button>
            </div>
            <form id="editForm">
                <input type="hidden" id="editId">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.4rem;">Judul Foto / Teks</label>
                    <input type="text" id="editJudulInput" style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 8px; font-size: 0.95rem;" required>
                </div>
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.4rem;">Ganti Foto (Opsional)</label>
                    <input type="file" id="editFotoInput" accept="image/*" style="width: 100%;">
                    <small style="color: #666; font-size: 0.8rem; display: block; margin-top: 0.3rem;">Kosongkan jika hanya ingin mengubah teks.</small>
                </div>
                <div style="text-align: center; margin-bottom: 1.5rem; background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                    <span style="font-size: 0.8rem; color: #666; display: block; margin-bottom: 0.5rem;">Pratinjau Foto:</span>
                    <img id="editCurrentPreview" src="" style="max-height: 160px; max-width: 100%; border-radius: 8px; object-fit: cover;">
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                    <button type="button" onclick="closeEditModal()" style="padding: 0.6rem 1.2rem; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer;">Batal</button>
                    <button type="submit" id="btnSaveEdit" style="padding: 0.6rem 1.2rem; border-radius: 8px; border: none; background: #f57c00; color: white; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-save"></i> Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- JS -->
    <script>
        const fotoInput = document.getElementById('fotoInput');
        const judulInput = document.getElementById('judulInput');
        const previewImage = document.getElementById('previewImage');
        const previewIcon = document.getElementById('previewIcon');
        const previewText = document.getElementById('previewText');
        const uploadForm = document.getElementById('uploadForm');
        const galleryGrid = document.getElementById('galleryGrid');

        // Modal Elements
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('editForm');
        const editId = document.getElementById('editId');
        const editJudulInput = document.getElementById('editJudulInput');
        const editFotoInput = document.getElementById('editFotoInput');
        const editCurrentPreview = document.getElementById('editCurrentPreview');

        // Live Preview: Judul
        judulInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            previewText.textContent = val ? val : 'Teks akan muncul di sini';
        });

        // Live Preview: Gambar
        fotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                    previewIcon.style.display = 'none';
                }
                reader.readAsDataURL(file);
            } else {
                previewImage.src = '';
                previewImage.style.display = 'none';
                previewIcon.style.display = 'block';
            }
        });

        // Live Preview: Gambar di Edit Modal
        editFotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    editCurrentPreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });

        // Upload Form Submit
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const file = fotoInput.files[0];
            const judul = judulInput.value.trim();
            
            if(!file || !judul) return;

            const formData = new FormData();
            formData.append('action', 'upload');
            formData.append('image', file);
            formData.append('judul', judul);

            try {
                const submitBtn = uploadForm.querySelector('button');
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah...';
                submitBtn.disabled = true;

                const res = await fetch('api/galeri.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await res.json();
                
                if (data.success) {
                    alert('Galeri berhasil diupload!');
                    uploadForm.reset();
                    previewImage.src = '';
                    previewImage.style.display = 'none';
                    previewIcon.style.display = 'block';
                    previewText.textContent = 'Teks akan muncul di sini';
                    
                    loadGallery(); // reload grid
                } else {
                    alert('Gagal: ' + data.message);
                }
            } catch (err) {
                console.error(err);
                alert('Terjadi kesalahan jaringan.');
            } finally {
                const submitBtn = uploadForm.querySelector('button');
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Upload & Simpan';
                submitBtn.disabled = false;
            }
        });

        // Edit Form Submit
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = editId.value;
            const judul = editJudulInput.value.trim();
            const file = editFotoInput.files[0];

            if (!id || !judul) return;

            const formData = new FormData();
            formData.append('action', 'update');
            formData.append('id', id);
            formData.append('judul', judul);
            if (file) {
                formData.append('image', file);
            }

            const btnSave = document.getElementById('btnSaveEdit');
            try {
                btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
                btnSave.disabled = true;

                const res = await fetch('api/galeri.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.success) {
                    alert('Galeri berhasil diperbarui!');
                    closeEditModal();
                    loadGallery();
                } else {
                    alert('Gagal: ' + data.message);
                }
            } catch (err) {
                console.error(err);
                alert('Terjadi kesalahan jaringan saat mengedit.');
            } finally {
                btnSave.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                btnSave.disabled = false;
            }
        });

        // Load Gallery
        async function loadGallery() {
            try {
                const res = await fetch('api/galeri.php');
                const result = await res.json();
                if (result.success) {
                    renderGallery(result.data);
                }
            } catch (err) {
                console.error(err);
                galleryGrid.innerHTML = '<p>Gagal memuat galeri.</p>';
            }
        }

        // Helper Escape HTML
        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        // Render Grid
        function renderGallery(items) {
            galleryGrid.innerHTML = '';
            if (items.length === 0) {
                galleryGrid.innerHTML = '<p style="grid-column: 1/-1; color:#666;">Belum ada foto galeri.</p>';
                return;
            }
            
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'gallery-item';
                div.style.position = 'relative';
                div.innerHTML = `
                    <div class="gallery-img-wrap">
                        <img src="${item.image_path}" alt="${escapeHtml(item.judul)}">
                    </div>
                    <div class="gallery-caption">
                        ${escapeHtml(item.judul)}
                    </div>
                    <div style="display: flex; gap: 0.4rem; padding: 0.5rem 0.8rem; background: #fafafa; border-top: 1px solid #eee; justify-content: flex-end;">
                        <button class="btn-edit-item" style="background: #0288d1; color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete-item" style="background: #d32f2f; color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem;">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                `;

                // Attach Event Listeners safely without HTML string escaping issues
                div.querySelector('.btn-edit-item').addEventListener('click', () => {
                    openEditModal(item.id, item.judul, item.image_path);
                });

                div.querySelector('.btn-delete-item').addEventListener('click', () => {
                    deleteGallery(item.id);
                });

                galleryGrid.appendChild(div);
            });
        }

        // Open Edit Modal
        function openEditModal(id, judul, imagePath) {
            editId.value = id;
            editJudulInput.value = judul;
            editCurrentPreview.src = imagePath;
            editFotoInput.value = '';
            editModal.style.display = 'flex';
        }

        // Close Edit Modal
        function closeEditModal() {
            editModal.style.display = 'none';
        }

        // Delete Gallery
        async function deleteGallery(id) {
            if(!confirm('Yakin ingin menghapus foto ini?')) return;
            
            try {
                const res = await fetch('api/galeri.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id: id })
                });
                const result = await res.json();
                if(result.success) {
                    loadGallery();
                } else {
                    alert('Gagal menghapus: ' + result.message);
                }
            } catch (err) {
                console.error(err);
                alert('Kesalahan saat menghapus.');
            }
        }

        // Init
        document.addEventListener('DOMContentLoaded', () => {
            loadGallery();
        });
    </script>
</body>
</html>
