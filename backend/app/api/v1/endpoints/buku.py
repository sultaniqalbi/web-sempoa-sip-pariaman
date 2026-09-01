from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.users import User, UserRole
from app.models.buku_siswa import BukuSiswa, StatusBuku
from app.models.siswa import Siswa
from app.schemas.buku import BukuSiswaCreate, BukuSiswaUpdate, BukuSiswaResponse

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
            available_progs = [p.strip().lower() for p in (guru.kategori_program or "").split(",") if p.strip()]
            prog_conditions = [func.lower(Siswa.kategori_program).like(f"%{p}%") for p in available_progs]
            query = query.filter(
                or_(
                    Siswa.id_guru == guru.id,
                    and_(Siswa.id_guru == None, or_(*prog_conditions)) if prog_conditions else Siswa.id_guru == guru.id
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
        if str(id_siswa) != str(current_user.uid_terhubung):
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

    new_buku = BukuSiswa(
        id_siswa=buku_in.id_siswa,
        kategori_program=buku_in.kategori_program,
        level_anak=buku_in.level_anak,
        nomor_buku=buku_in.nomor_buku,
        jenis_buku=buku_in.jenis_buku,
        status_buku=buku_in.status_buku,
        tanggal_mulai=buku_in.tanggal_mulai or date.today(),
        tanggal_selesai=buku_in.tanggal_selesai,
        catatan_progres=buku_in.catatan_progres
    )
    db.add(new_buku)
    db.commit()
    db.refresh(new_buku)

    res = BukuSiswaResponse.model_validate(new_buku)
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

    # If status is set to SELESAI and tanggal_selesai is empty, auto set today
    if buku.status_buku == StatusBuku.SELESAI and not buku.tanggal_selesai:
        buku.tanggal_selesai = date.today()

    db.commit()
    db.refresh(buku)

    siswa = db.query(Siswa).filter(Siswa.id == buku.id_siswa).first()
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
