from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.users import User, UserRole
from app.models.evaluasi_siswa import EvaluasiSiswa
from app.models.siswa import Siswa
from app.models.guru import Guru
from app.schemas.evaluasi import EvaluasiCreate, EvaluasiUpdate, EvaluasiResponse

router = APIRouter()

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

@router.get("/", response_model=List[EvaluasiResponse])
def get_all_evaluasi(
    program: Optional[str] = None,
    id_siswa: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ambil daftar evaluasi siswa (Guru hanya melihat muridnya / programnya, Admin/Owner melihat semua)
    """
    query = db.query(
        EvaluasiSiswa,
        Siswa.nama.label("nama_siswa"),
        Siswa.uid.label("uid_siswa"),
        Guru.nama.label("nama_guru")
    ).join(Siswa, EvaluasiSiswa.id_siswa == Siswa.id).outerjoin(Guru, EvaluasiSiswa.id_guru == Guru.id).filter(Siswa.is_deleted == False)

    # Filter by role
    if current_user.role == UserRole.guru:
        guru = _get_current_guru(db, current_user)
        if guru:
            is_supervisor = any(k in (guru.kategori_program or "").lower() for k in ["kepala sekolah", "kepsek", "direktur", "admin", "owner"])
            if not is_supervisor:
                matching_guru_ids = [g[0] for g in db.query(Guru.id).filter(
                    Guru.is_deleted == False,
                    or_(
                        Guru.id == guru.id,
                        func.lower(Guru.nama) == guru.nama.lower().strip(),
                        func.lower(Guru.nama_panggilan) == guru.nama.lower().strip(),
                        func.lower(Guru.nama).like(f"%{guru.nama.lower().strip()}%")
                    )
                ).all()]
                if not matching_guru_ids:
                    matching_guru_ids = [guru.id]

                available_progs = [p.strip().lower() for p in (guru.kategori_program or "").split(",") if p.strip()]
                prog_conditions = [func.lower(Siswa.kategori_program).like(f"%{p}%") for p in available_progs]
                query = query.filter(
                    or_(
                        EvaluasiSiswa.id_guru.in_(matching_guru_ids),
                        Siswa.id_guru.in_(matching_guru_ids),
                        and_(Siswa.id_guru == None, or_(*prog_conditions)) if prog_conditions else False
                    )
                )
    elif current_user.role == UserRole.ortu:
        if current_user.uid_terhubung:
            query = query.filter(EvaluasiSiswa.id_siswa == int(current_user.uid_terhubung))

    if id_siswa:
        query = query.filter(EvaluasiSiswa.id_siswa == id_siswa)
    if program and program != "all":
        query = query.filter(EvaluasiSiswa.kategori_program.ilike(f"%{program}%"))

    results = query.order_by(EvaluasiSiswa.tanggal_evaluasi.desc(), EvaluasiSiswa.created_at.desc()).all()

    response_list = []
    for evaluasi, nama_siswa, uid_siswa, nama_guru in results:
        res = EvaluasiResponse.model_validate(evaluasi)
        res.nama_siswa = nama_siswa
        res.uid_siswa = uid_siswa
        res.nama_guru = nama_guru or "Pengajar Sempoa SIP"
        response_list.append(res)
    
    return response_list

@router.get("/siswa/{id_siswa}", response_model=List[EvaluasiResponse])
def get_evaluasi_by_siswa(
    id_siswa: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ambil lembar evaluasi untuk 1 siswa tertentu (Ortu, Guru, Admin, Owner)
    """
    if current_user.role == UserRole.ortu:
        if str(id_siswa) != str(current_user.uid_terhubung):
            raise HTTPException(status_code=403, detail="Akses ditolak ke data evaluasi anak lain")

    query = db.query(
        EvaluasiSiswa,
        Siswa.nama.label("nama_siswa"),
        Siswa.uid.label("uid_siswa"),
        Guru.nama.label("nama_guru")
    ).join(Siswa, EvaluasiSiswa.id_siswa == Siswa.id).outerjoin(Guru, EvaluasiSiswa.id_guru == Guru.id).filter(
        EvaluasiSiswa.id_siswa == id_siswa,
        Siswa.is_deleted == False
    ).order_by(EvaluasiSiswa.tanggal_evaluasi.desc(), EvaluasiSiswa.created_at.desc())

    results = query.all()
    response_list = []
    for evaluasi, nama_siswa, uid_siswa, nama_guru in results:
        res = EvaluasiResponse.model_validate(evaluasi)
        res.nama_siswa = nama_siswa
        res.uid_siswa = uid_siswa
        res.nama_guru = nama_guru or "Pengajar Sempoa SIP"
        response_list.append(res)
    return response_list

@router.post("/", response_model=EvaluasiResponse, status_code=status.HTTP_201_CREATED)
def create_evaluasi(
    eval_in: EvaluasiCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Input lembar evaluasi perkembangan siswa (Guru / Admin / Owner)
    """
    siswa = db.query(Siswa).filter(Siswa.id == eval_in.id_siswa, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    # Auto assign id_guru if user is a teacher
    id_guru = eval_in.id_guru
    if current_user.role == UserRole.guru:
        guru = _get_current_guru(db, current_user)
        if guru:
            id_guru = guru.id

    new_eval = EvaluasiSiswa(
        id_siswa=eval_in.id_siswa,
        id_guru=id_guru,
        kategori_program=eval_in.kategori_program or siswa.kategori_program,
        tanggal_evaluasi=eval_in.tanggal_evaluasi or date.today(),
        periode_evaluasi=eval_in.periode_evaluasi,
        nilai_fokus=eval_in.nilai_fokus,
        nilai_kecepatan=eval_in.nilai_kecepatan,
        nilai_ketelitian=eval_in.nilai_ketelitian,
        nilai_pemahaman=eval_in.nilai_pemahaman,
        predikat_keseluruhan=eval_in.predikat_keseluruhan,
        catatan_guru=eval_in.catatan_guru,
        saran_untuk_ortu=eval_in.saran_untuk_ortu
    )
    db.add(new_eval)
    db.commit()
    db.refresh(new_eval)

    nama_guru = "Pengajar Sempoa SIP"
    if id_guru:
        g = db.query(Guru).filter(Guru.id == id_guru).first()
        if g:
            nama_guru = g.nama

    res = EvaluasiResponse.model_validate(new_eval)
    res.nama_siswa = siswa.nama
    res.uid_siswa = siswa.uid
    res.nama_guru = nama_guru
    return res

@router.put("/{id}", response_model=EvaluasiResponse)
def update_evaluasi(
    id: int,
    eval_in: EvaluasiUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update lembar evaluasi (Guru / Admin / Owner)
    """
    eval_obj = db.query(EvaluasiSiswa).filter(EvaluasiSiswa.id == id).first()
    if not eval_obj:
        raise HTTPException(status_code=404, detail="Data evaluasi tidak ditemukan")

    update_data = eval_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(eval_obj, field, val)

    db.commit()
    db.refresh(eval_obj)

    siswa = db.query(Siswa).filter(Siswa.id == eval_obj.id_siswa).first()
    guru = db.query(Guru).filter(Guru.id == eval_obj.id_guru).first() if eval_obj.id_guru else None

    res = EvaluasiResponse.model_validate(eval_obj)
    if siswa:
        res.nama_siswa = siswa.nama
        res.uid_siswa = siswa.uid
    res.nama_guru = guru.nama if guru else "Pengajar Sempoa SIP"
    return res

@router.delete("/{id}")
def delete_evaluasi(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Hapus lembar evaluasi (Admin / Owner / Guru pembuat)
    """
    eval_obj = db.query(EvaluasiSiswa).filter(EvaluasiSiswa.id == id).first()
    if not eval_obj:
        raise HTTPException(status_code=404, detail="Data evaluasi tidak ditemukan")

    db.delete(eval_obj)
    db.commit()
    return {"message": "Data evaluasi berhasil dihapus"}

@router.post("/export-sheets")
async def export_evaluasi_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export Lembar Evaluasi & Rapor Siswa ke Google Sheets
    """
    if current_user.role not in [UserRole.admin, UserRole.owner]:
        raise HTTPException(status_code=403, detail="Hanya admin/owner yang dapat melakukan ekspor")

    results = db.query(
        EvaluasiSiswa,
        Siswa.nama.label("nama_siswa"),
        Siswa.uid.label("uid_siswa"),
        Guru.nama.label("nama_guru")
    ).join(Siswa, EvaluasiSiswa.id_siswa == Siswa.id).outerjoin(Guru, EvaluasiSiswa.id_guru == Guru.id).filter(Siswa.is_deleted == False).order_by(EvaluasiSiswa.tanggal_evaluasi.desc(), EvaluasiSiswa.created_at.desc()).all()

    rows = [[
        "Nama Siswa", "UID Siswa", "Kategori Program", "Guru Penilai",
        "Tanggal Evaluasi", "Periode", "Fokus Belajar", "Kecepatan Menghitung",
        "Ketelitian", "Pemahaman Konsep", "Predikat Keseluruhan", "Catatan Guru", "Saran untuk Orang Tua"
    ]]

    for evaluasi, nama_siswa, uid_siswa, nama_guru in results:
        rows.append([
            nama_siswa,
            uid_siswa,
            evaluasi.kategori_program or "-",
            nama_guru or "Pengajar Sempoa SIP",
            evaluasi.tanggal_evaluasi.strftime("%Y-%m-%d") if evaluasi.tanggal_evaluasi else "-",
            evaluasi.periode_evaluasi or "-",
            evaluasi.nilai_fokus or "-",
            evaluasi.nilai_kecepatan or "-",
            evaluasi.nilai_ketelitian or "-",
            evaluasi.nilai_pemahaman or "-",
            evaluasi.predikat_keseluruhan or "-",
            evaluasi.catatan_guru or "-",
            evaluasi.saran_untuk_ortu or "-"
        ])

    from app.services.google_sheets import send_to_google_sheet
    return send_to_google_sheet(tab_name="Evaluasi Siswa", rows=rows, title="Data Evaluasi & Rapor Siswa")
