from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.users import User, UserRole
from app.models.buku_siswa import BukuSiswa, StatusBuku
from app.models.siswa import Siswa
from app.schemas.buku import BukuSiswaCreate, BukuSiswaUpdate, BukuSiswaResponse, NaikLevelRequest
from app.services.audit_service import log_activity

router = APIRouter()

from app.models.guru import Guru
from sqlalchemy import or_, and_, func

def _get_current_guru(db: Session, user: User) -> Optional[Guru]:
    if user.uid_terhubung:
        try:
            int_id = int(user.uid_terhubung)
            guru = db.query(Guru).filter((Guru.id == int_id) | (Guru.uid == str(user.uid_terhubung))).first()
        except (ValueError, TypeError):
            guru = db.query(Guru).filter(Guru.uid == str(user.uid_terhubung)).first()
        if guru:
            return guru
    
    if user.nama:
        guru = db.query(Guru).filter(
            (func.lower(Guru.nama) == user.nama.lower().strip()) |
            (func.lower(Guru.nama_panggilan) == user.nama.lower().strip()) |
            (func.lower(Guru.nama).contains(user.nama.lower().strip()))
        ).first()
        if guru:
            return guru

    email_prefix = user.email.split("@")[0].lower()
    guru = db.query(Guru).filter(
        (Guru.nama.ilike(f"%{email_prefix}%")) |
        (Guru.nama_panggilan.ilike(f"%{email_prefix}%"))
    ).first()
    return guru

@router.get("/", response_model=List[BukuSiswaResponse])
def get_all_buku_siswa(
    program: Optional[str] = None,
    level: Optional[str] = None,
    status_buku: Optional[StatusBuku] = None,
    id_siswa: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ambil semua data buku siswa dengan filter (Guru hanya melihat murid bimbingannya)
    """
    query = db.query(
        BukuSiswa,
        Siswa.nama.label("nama_siswa"),
        Siswa.uid.label("uid_siswa")
    ).join(Siswa, BukuSiswa.id_siswa == Siswa.id).filter(Siswa.is_deleted == False)

    # Filter khusus Guru: hanya siswa yang diajarkan oleh guru yang login
    if current_user.role == UserRole.guru:
        guru = _get_current_guru(db, current_user)
        if guru:
            is_supervisor = any(k in (guru.kategori_program or "").lower() for k in ["kepala sekolah", "kepsek", "direktur", "admin", "owner"])
            if not is_supervisor:
                guru_nama = guru.nama.strip() if guru.nama else ""
                matching_guru_ids = [g[0] for g in db.query(Guru.id).filter(
                    Guru.is_deleted == False,
                    or_(
                        Guru.id == guru.id,
                        Guru.nama.ilike(guru_nama),
                        Guru.nama_panggilan.ilike(guru_nama),
                        Guru.nama.ilike(f"%{guru_nama}%")
                    )
                ).all()]
                if not matching_guru_ids:
                    matching_guru_ids = [guru.id]

                available_progs = [p.strip().lower() for p in (guru.kategori_program or "").split(",") if p.strip()]
                prog_conditions = [Siswa.kategori_program.ilike(f"%{p}%") for p in available_progs]
                query = query.filter(
                    or_(
                        Siswa.id_guru.in_(matching_guru_ids),
                        and_(Siswa.id_guru == None, or_(*prog_conditions)) if prog_conditions else False
                    )
                )

    if id_siswa:
        query = query.filter(BukuSiswa.id_siswa == id_siswa)
    if program and program != "all":
        query = query.filter(BukuSiswa.kategori_program.ilike(f"%{program}%"))
    if level and level != "all":
        query = query.filter(BukuSiswa.level_anak.ilike(f"%{level}%"))
    if status_buku:
        query = query.filter(BukuSiswa.status_buku == status_buku)

    results = query.order_by(BukuSiswa.created_at.desc()).all()
    
    response_list = []
    for buku, nama_siswa, uid_siswa in results:
        res = BukuSiswaResponse.model_validate(buku)
        res.nama_siswa = nama_siswa
        res.uid_siswa = uid_siswa
        response_list.append(res)
    
    return response_list

@router.get("/siswa/{id_siswa}", response_model=List[BukuSiswaResponse])
def get_buku_by_siswa(
    id_siswa: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ambil riwayat buku & level untuk 1 siswa tertentu (Ortu, Guru, Admin, Owner)
    """
    # If ortu, ensure accessing own child
    if current_user.role == UserRole.ortu:
        siswa_obj = db.query(Siswa).filter(Siswa.id == id_siswa, Siswa.is_deleted == False).first()
        allowed = (
            str(id_siswa) == str(current_user.uid_terhubung) or
            (siswa_obj and siswa_obj.uid == str(current_user.uid_terhubung))
        )
        if not allowed:
            raise HTTPException(status_code=403, detail="Akses ditolak ke data anak lain")

    query = db.query(
        BukuSiswa,
        Siswa.nama.label("nama_siswa"),
        Siswa.uid.label("uid_siswa")
    ).join(Siswa, BukuSiswa.id_siswa == Siswa.id).filter(
        BukuSiswa.id_siswa == id_siswa,
        Siswa.is_deleted == False
    ).order_by(BukuSiswa.created_at.desc())

    results = query.all()
    response_list = []
    for buku, nama_siswa, uid_siswa in results:
        res = BukuSiswaResponse.model_validate(buku)
        res.nama_siswa = nama_siswa
        res.uid_siswa = uid_siswa
        response_list.append(res)
    return response_list

@router.post("/", response_model=BukuSiswaResponse, status_code=status.HTTP_201_CREATED)
def create_buku_siswa(
    buku_in: BukuSiswaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tambah data buku & level siswa baru (Admin, Owner, Guru)
    """
    siswa = db.query(Siswa).filter(Siswa.id == buku_in.id_siswa, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    st = buku_in.status_buku or StatusBuku.SEDANG_DIPELAJARI
    tgl_sel = buku_in.tanggal_selesai
    if tgl_sel and st == StatusBuku.SEDANG_DIPELAJARI:
        st = StatusBuku.SELESAI
    elif st in [StatusBuku.SELESAI, StatusBuku.LANJUT_LEVEL] and not tgl_sel:
        tgl_sel = date.today()

    # Jika buku baru didaftarkan sebagai SEDANG_DIPELAJARI, otomatis ubah buku aktif sebelumnya
    # untuk siswa dan program yang sama menjadi LANJUT_LEVEL (agar otomatis masuk ke riwayat modul)
    if st == StatusBuku.SEDANG_DIPELAJARI:
        prev_active_books = db.query(BukuSiswa).filter(
            BukuSiswa.id_siswa == buku_in.id_siswa,
            BukuSiswa.kategori_program == buku_in.kategori_program,
            BukuSiswa.status_buku == StatusBuku.SEDANG_DIPELAJARI
        ).all()
        for old_b in prev_active_books:
            old_b.status_buku = StatusBuku.LANJUT_LEVEL
            if not old_b.tanggal_selesai:
                old_b.tanggal_selesai = buku_in.tanggal_mulai or date.today()

    new_buku = BukuSiswa(
        id_siswa=buku_in.id_siswa,
        kategori_program=buku_in.kategori_program,
        level_anak=buku_in.level_anak,
        nomor_buku=buku_in.nomor_buku,
        jenis_buku=buku_in.jenis_buku,
        status_buku=st,
        tanggal_mulai=buku_in.tanggal_mulai or date.today(),
        tanggal_selesai=tgl_sel,
        catatan_progres=buku_in.catatan_progres
    )
    db.add(new_buku)

    log_activity(
        db=db,
        action="PENAMBAHAN",
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        email=current_user.email,
        modul="Data Buku",
        deskripsi=f"Menambahkan progres buku {new_buku.level_anak} ({new_buku.kategori_program}) untuk siswa: {siswa.nama}",
        status="SUCCESS",
        target_id=new_buku.id,
        target_nama=siswa.nama,
        after={"level": new_buku.level_anak, "program": new_buku.kategori_program, "status": str(new_buku.status_buku)}
    )

    db.commit()
    db.refresh(new_buku)

    res = BukuSiswaResponse.model_validate(new_buku)
    res.nama_siswa = siswa.nama
    res.uid_siswa = siswa.uid
    return res

@router.post("/naik-level", response_model=BukuSiswaResponse, status_code=status.HTTP_201_CREATED)
def naik_level_siswa(
    req: NaikLevelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Menu Khusus Naik Level Siswa (Guru, Admin, Owner):
    1. Mengubah status buku lama menjadi LANJUT_LEVEL dengan tanggal_selesai
    2. Membuat buku baru berstatus SEDANG_DIPELAJARI dengan level_anak baru
    3. Mencatat aktivitas ke audit log
    """
    buku_lama = db.query(BukuSiswa).filter(BukuSiswa.id == req.id_buku_lama).first()
    if not buku_lama:
        raise HTTPException(status_code=404, detail="Data buku sebelumnya tidak ditemukan")

    siswa = db.query(Siswa).filter(Siswa.id == buku_lama.id_siswa, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    tgl_transisi = req.tanggal_naik_level or date.today()

    # 1. Update buku lama menjadi LANJUT_LEVEL
    buku_lama.status_buku = StatusBuku.LANJUT_LEVEL
    buku_lama.tanggal_selesai = tgl_transisi

    # 2. Buat buku baru untuk level berikutnya
    buku_baru = BukuSiswa(
        id_siswa=buku_lama.id_siswa,
        kategori_program=buku_lama.kategori_program,
        level_anak=req.level_baru,
        nomor_buku=req.nomor_buku_baru or "",
        jenis_buku=req.jenis_buku_baru or buku_lama.jenis_buku or "Buku Paket",
        status_buku=StatusBuku.SEDANG_DIPELAJARI,
        tanggal_mulai=tgl_transisi,
        tanggal_selesai=None,
        catatan_progres=req.catatan_naik_level or f"Naik level dari {buku_lama.level_anak}"
    )
    db.add(buku_baru)

    log_activity(
        db=db,
        action="PROMOSI_LEVEL",
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        email=current_user.email,
        modul="Data Buku",
        deskripsi=f"Siswa {siswa.nama} berhasil NAIK LEVEL dari {buku_lama.level_anak} ke {buku_baru.level_anak} ({buku_baru.kategori_program})",
        status="SUCCESS",
        target_id=buku_baru.id,
        target_nama=siswa.nama,
        after={
            "level_lama": buku_lama.level_anak,
            "level_baru": buku_baru.level_anak,
            "program": buku_baru.kategori_program,
            "tanggal": str(tgl_transisi)
        }
    )

    db.commit()
    db.refresh(buku_baru)

    res = BukuSiswaResponse.model_validate(buku_baru)
    res.nama_siswa = siswa.nama
    res.uid_siswa = siswa.uid
    return res

@router.put("/{id}", response_model=BukuSiswaResponse)
def update_buku_siswa(
    id: int,
    buku_in: BukuSiswaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update status / level / nomor buku siswa (Admin, Owner, Guru)
    """
    buku = db.query(BukuSiswa).filter(BukuSiswa.id == id).first()
    if not buku:
        raise HTTPException(status_code=404, detail="Data buku siswa tidak ditemukan")

    update_data = buku_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(buku, field, val)

    # Sinkronisasi status_buku dan tanggal_selesai
    if buku.tanggal_selesai and buku.status_buku == StatusBuku.SEDANG_DIPELAJARI:
        buku.status_buku = StatusBuku.SELESAI
    elif buku.status_buku in [StatusBuku.SELESAI, StatusBuku.LANJUT_LEVEL] and not buku.tanggal_selesai:
        buku.tanggal_selesai = date.today()

    siswa = db.query(Siswa).filter(Siswa.id == buku.id_siswa).first()

    log_activity(
        db=db,
        action="PERUBAHAN",
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        email=current_user.email,
        modul="Data Buku",
        deskripsi=f"Memperbarui data buku {buku.level_anak} siswa {siswa.nama if siswa else '-'}",
        status="SUCCESS",
        target_id=buku.id,
        target_nama=siswa.nama if siswa else None,
        after={k: str(v) for k, v in update_data.items()}
    )

    db.commit()
    db.refresh(buku)

    res = BukuSiswaResponse.model_validate(buku)
    if siswa:
        res.nama_siswa = siswa.nama
        res.uid_siswa = siswa.uid
    return res

@router.delete("/{id}")
def delete_buku_siswa(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Hapus catatan buku siswa (Admin & Owner)
    """
    if current_user.role not in [UserRole.admin, UserRole.owner]:
        raise HTTPException(status_code=403, detail="Hanya admin/owner yang dapat menghapus data buku")

    buku = db.query(BukuSiswa).filter(BukuSiswa.id == id).first()
    if not buku:
        raise HTTPException(status_code=404, detail="Data buku tidak ditemukan")

    siswa = db.query(Siswa).filter(Siswa.id == buku.id_siswa).first()

    log_activity(
        db=db,
        action="PENGHAPUSAN",
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        email=current_user.email,
        modul="Data Buku",
        deskripsi=f"Menghapus data buku {buku.level_anak} siswa {siswa.nama if siswa else '-'}",
        status="SUCCESS",
        target_id=buku.id,
        target_nama=siswa.nama if siswa else None
    )

    db.delete(buku)
    db.commit()
    return {"message": "Data buku berhasil dihapus"}

@router.post("/export-sheets")
async def export_buku_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export Progres Buku Siswa ke Google Sheets
    """
    if current_user.role not in [UserRole.admin, UserRole.owner]:
        raise HTTPException(status_code=403, detail="Hanya admin/owner yang dapat melakukan ekspor")

    results = db.query(
        BukuSiswa,
        Siswa.nama.label("nama_siswa"),
        Siswa.uid.label("uid_siswa")
    ).join(Siswa, BukuSiswa.id_siswa == Siswa.id).filter(Siswa.is_deleted == False).order_by(BukuSiswa.created_at.desc()).all()

    rows = [[
        "Nama Siswa", "UID Siswa", "Kategori Program", "Level Anak",
        "Nomor Buku", "Jenis Buku", "Status Buku", "Tanggal Mulai",
        "Tanggal Selesai", "Catatan Progres"
    ]]

    for buku, nama_siswa, uid_siswa in results:
        rows.append([
            nama_siswa,
            uid_siswa,
            buku.kategori_program or "-",
            buku.level_anak or "-",
            buku.nomor_buku or "-",
            buku.jenis_buku or "-",
            buku.status_buku.value if hasattr(buku.status_buku, 'value') else str(buku.status_buku or "-"),
            buku.tanggal_mulai.strftime("%Y-%m-%d") if buku.tanggal_mulai else "-",
            buku.tanggal_selesai.strftime("%Y-%m-%d") if buku.tanggal_selesai else "-",
            buku.catatan_progres or "-"
        ])

    from app.services.google_sheets import send_to_google_sheet
    return send_to_google_sheet(tab_name="Data Buku", rows=rows, title="Data Progres Buku Siswa")
