import os
import json
from datetime import datetime, timedelta, date
from app.core.security import get_password_hash
from app.models.siswa import StatusSPP
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.models.users import User, UserRole
from app.models.siswa import Siswa
from app.models.guru import Guru
from app.models.jadwal import Jadwal
from app.models.absensi_log import AbsensiLog
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.bukti_transfer import BuktiTransfer
from app.models.galeri import Galeri
from app.models.audit_log import AuditLog
from app.models.catatan_pembelajaran import CatatanPembelajaran
from app.models.keuangan import Keuangan
from app.models.pendaftaran_baru import PendaftaranBaru
from pydantic import BaseModel

router = APIRouter()
owner_only = RoleChecker([UserRole.owner])

class RekapBulananRequest(BaseModel):
    bulan: str  # YYYY-MM

class ResetDataRequest(BaseModel):
    confirmation_phrase: str
    password: str

ALLOWED_RESET_PHRASES = [
    "HAPUS SEMUA DATA SELAMANYA",
    "SETUJU KEHILANGAN SEMUA DATA",
    "RESET DATABASE PRODUKSI"
]

@router.get("/pertumbuhan")
async def get_pertumbuhan_siswa(
    range: str = Query("1tahun", regex="^(6bulan|1tahun|semua)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Tren Pertumbuhan Murid
    """
    # 1. Active students count per program
    program_counts = (
        db.query(Siswa.kategori_program, func.count(Siswa.id))
        .filter(Siswa.is_deleted == False)
        .group_by(Siswa.kategori_program)
        .all()
    )
    per_program = [{"program": p, "jumlah_aktif": c} for p, c in program_counts]

    # 2. Monthly new student growth trend
    # Query grouped by YYYY-MM created_at
    all_students = db.query(Siswa).filter(Siswa.is_deleted == False).order_by(Siswa.created_at.asc()).all()
    
    monthly_map = {}
    for s in all_students:
        month_str = s.created_at.strftime("%Y-%m") if s.created_at else "2026-01"
        monthly_map[month_str] = monthly_map.get(month_str, 0) + 1
        
    sorted_months = sorted(monthly_map.keys())
    
    # Filter range
    if range == "6bulan" and len(sorted_months) > 6:
        sorted_months = sorted_months[-6:]
    elif range == "1tahun" and len(sorted_months) > 12:
        sorted_months = sorted_months[-12:]
        
    per_bulan = []
    cumulative = 0
    for m in sorted_months:
        new_count = monthly_map[m]
        cumulative += new_count
        per_bulan.append({
            "bulan": m,
            "siswa_baru": new_count,
            "kumulatif_aktif": cumulative
        })

    # 3. Total Guru
    total_guru = db.query(Guru).count()

    # 4. Total Keuangan SPP Lunas (All time or current year)
    total_keuangan = db.query(func.sum(PembayaranPeriode.jumlah)).filter(PembayaranPeriode.status == StatusPembayaran.LUNAS).scalar() or 0.0

    return {
        "range": range,
        "total_aktif": sum(c for _, c in program_counts),
        "total_guru": total_guru,
        "total_keuangan": float(total_keuangan),
        "growth_murid": 0,
        "growth_guru": 0,
        "growth_keuangan": 0,
        "per_bulan": per_bulan,
        "per_program": per_program
    }

@router.get("/keuangan")
async def get_laporan_keuangan(
    bulan: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Data Keuangan Lengkap
    """
    if not bulan:
        bulan = datetime.utcnow().strftime("%Y-%m")

    # 1. Total revenue for specified month (LUNAS)
    revenue_q = (
        db.query(func.sum(PembayaranPeriode.jumlah))
        .filter(
            PembayaranPeriode.periode_bulan == bulan,
            PembayaranPeriode.status == StatusPembayaran.LUNAS
        )
        .scalar()
    )
    total_pendapatan = float(revenue_q or 0.0)

    # 2. Breakdown per status for specified month
    status_q = (
        db.query(PembayaranPeriode.status, func.count(PembayaranPeriode.id))
        .filter(PembayaranPeriode.periode_bulan == bulan)
        .group_by(PembayaranPeriode.status)
        .all()
    )
    per_status = [{"status": s.value, "jumlah": c} for s, c in status_q]

    # 3. Revenue per program
    program_rev = (
        db.query(Siswa.kategori_program, func.sum(PembayaranPeriode.jumlah))
        .join(PembayaranPeriode, Siswa.id == PembayaranPeriode.id_siswa)
        .filter(
            PembayaranPeriode.periode_bulan == bulan,
            PembayaranPeriode.status == StatusPembayaran.LUNAS,
            Siswa.is_deleted == False
        )
        .group_by(Siswa.kategori_program)
        .all()
    )
    per_program = [{"program": p, "pendapatan": float(amt or 0)} for p, amt in program_rev]

    # 4. 6-Month Trend
    all_periodes = (
        db.query(PembayaranPeriode.periode_bulan, func.sum(PembayaranPeriode.jumlah))
        .filter(PembayaranPeriode.status == StatusPembayaran.LUNAS)
        .group_by(PembayaranPeriode.periode_bulan)
        .order_by(PembayaranPeriode.periode_bulan.desc())
        .limit(6)
        .all()
    )
    tren_6_bulan = [{"bulan": p, "pendapatan": float(amt or 0)} for p, amt in reversed(all_periodes)]

    return {
        "bulan": bulan,
        "total_pendapatan": total_pendapatan,
        "per_program": per_program,
        "per_status": per_status,
        "tren_6_bulan": tren_6_bulan
    }

@router.post("/rekap-bulanan")
async def generate_rekap_bulanan(
    req: RekapBulananRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Generate & Write Rekap Bulanan to Google Sheets
    """
    bulan = req.bulan
    service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    sheet_id = os.getenv("GOOGLE_SHEET_ID")

    # Aggregate monthly stats
    siswa_aktif = db.query(Siswa).filter(Siswa.is_deleted == False).count()
    revenue = (
        db.query(func.sum(PembayaranPeriode.jumlah))
        .filter(
            PembayaranPeriode.periode_bulan == bulan,
            PembayaranPeriode.status == StatusPembayaran.LUNAS
        )
        .scalar()
    ) or 0.0

    program_stats = (
        db.query(Siswa.kategori_program, func.count(Siswa.id))
        .filter(Siswa.is_deleted == False)
        .group_by(Siswa.kategori_program)
        .all()
    )

    rows = [
        ["REKAP BULANAN SEMPOA SIP TC PARIAMAN"],
        ["Periode", bulan],
        ["Generated At", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")],
        ["Total Siswa Aktif", siswa_aktif],
        ["Total Pendapatan (LUNAS)", float(revenue)],
        [],
        ["--- RINGKASAN PROGRAM ---"],
        ["Program", "Jumlah Siswa Aktif"]
    ]
    for prog, count in program_stats:
        rows.append([prog, count])
        
    # 1. Tambah Data Siswa
    rows.append([])
    rows.append(["--- DATA SISWA ---"])
    rows.append(["UID", "Nama", "Program", "Umur", "Status SPP", "Sisa Pertemuan", "Ortu", "WA Ortu"])
    semua_siswa = db.query(Siswa).filter(Siswa.is_deleted == False).order_by(Siswa.nama.asc()).all()
    for s in semua_siswa:
        status_spp_val = s.status_spp.value if hasattr(s.status_spp, 'value') else str(s.status_spp)
        rows.append([s.uid, s.nama, s.kategori_program, s.umur, status_spp_val, s.sisa_pertemuan, s.nama_orang_tua, s.whatsapp_orang_tua])

    # 2. Tambah Data Guru
    rows.append([])
    rows.append(["--- DATA GURU ---"])
    rows.append(["UID", "Nama", "Program", "Hari Mengajar", "Mode Kelas", "No WA"])
    semua_guru = db.query(Guru).order_by(Guru.nama.asc()).all()
    for g in semua_guru:
        rows.append([g.uid, g.nama, g.kategori_program, g.hari_wajib, g.mode_kelas, g.whatsapp_guru])

    # 3. Tambah Data Keuangan (Bulan ini)
    rows.append([])
    rows.append([f"--- DATA KEUANGAN ({bulan}) ---"])
    rows.append(["ID", "Siswa ID", "Periode", "Jumlah", "Status"])
    pembayaran_bulan = db.query(PembayaranPeriode).filter(PembayaranPeriode.periode_bulan == bulan).order_by(PembayaranPeriode.created_at.asc()).all()
    for p in pembayaran_bulan:
        status_p = p.status.value if hasattr(p.status, 'value') else str(p.status)
        rows.append([p.id, p.id_siswa, p.periode_bulan, float(p.jumlah), status_p])

    from app.services.google_sheets import send_to_google_sheet
    tab_name = "Data Pertumbuhan"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title=f"Rekap Bulanan {bulan}")


@router.post("/reset-data")
async def reset_semua_data(
    req: ResetDataRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Dual-Factor Safe Reset All Operational Data with Auto-Backup
    """
    # 0. Check password
    if req.password != "z@vx736S23V@Gvybd27#@gsh":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password reset data tidak valid."
        )

    # 1. Phrase verification
    phrase = req.confirmation_phrase.strip()
    if phrase not in ALLOWED_RESET_PHRASES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Frasa konfirmasi tidak cocok. Gunakan salah satu dari frasa yang diizinkan."
        )

    timestamp_str = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    backup_filename = f"reset-{timestamp_str}.json"
    backup_dir = Path(os.getenv("BACKUP_DIR", "backups"))
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_filepath = backup_dir / backup_filename

    # 2. Build backup JSON dump
    try:
        siswa_list = [
            {"id": s.id, "nama": s.nama, "program": s.kategori_program, "uid": s.uid}
            for s in db.query(Siswa).all()
        ]
        guru_list = [
            {"id": g.id, "nama": g.nama, "uid": g.uid, "program": g.kategori_program}
            for g in db.query(Guru).all()
        ]
        jadwal_list = [
            {"id": j.id, "hari": j.hari, "jam_mulai": j.jam_mulai}
            for j in db.query(Jadwal).all()
        ]
        pembayaran_list = [
            {"id": p.id, "id_siswa": p.id_siswa, "periode": p.periode_bulan, "jumlah": float(p.jumlah), "status": p.status.value}
            for p in db.query(PembayaranPeriode).all()
        ]

        dump_data = {
            "metadata": {
                "executed_by": current_user.email,
                "executed_at": datetime.utcnow().isoformat(),
                "phrase_used": phrase
            },
            "siswa": siswa_list,
            "guru": guru_list,
            "jadwal": jadwal_list,
            "pembayaran": pembayaran_list
        }

        with open(backup_filepath, "w", encoding="utf-8") as f:
            json.dump(dump_data, f, indent=2)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal membuat backup sebelum reset: {str(e)}"
        )

    # 3. Perform operational data wipe in DB transaction
    try:
        db.query(BuktiTransfer).delete()
        db.query(PembayaranPeriode).delete()
        db.query(AbsensiLog).delete()
        db.query(CatatanPembelajaran).delete()
        db.query(Jadwal).delete()
        db.query(Guru).delete()
        db.query(Siswa).delete()
        db.query(Galeri).delete()
        db.query(Keuangan).delete()
        db.query(PendaftaranBaru).delete()
        
        # Hapus akun dummy Ortu & Guru (agar tidak nyangkut loginnya)
        db.query(User).filter(User.role.in_([UserRole.ortu, UserRole.guru])).delete(synchronize_session=False)

        # Log action to AuditLog
        audit = AuditLog(
            action="RESET_DATA",
            role=current_user.role.value,
            email=current_user.email,
            details={"phrase": phrase, "backup_filename": backup_filename},
            status="SUCCESS",
            backup_file=str(backup_filepath)
        )
        db.add(audit)
        db.commit()

        # Bersihkan Google Sheets
        try:
            from app.services.google_sheets import send_to_google_sheet
            tabs_to_reset = ["Data Siswa", "Data Guru", "Data Kelas", "Data Keuangan", "Data Pertumbuhan", "Data Absensi"]
            reset_row = [[f"DATABASE TELAH DI-RESET TOTAL PADA {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"]]
            for tab in tabs_to_reset:
                send_to_google_sheet(tab_name=tab, rows=reset_row, title="RESET DATABASE")
        except Exception as e:
            print(f"Failed to reset Google Sheets: {e}")

        return {
            "status": "success",
            "message": f"Data operasional berhasil dihapus dan Google Sheets dibersihkan. Backup disimpan di: {backup_filename}",
            "backup_file": backup_filename,
            "executed_at": datetime.utcnow().isoformat(),
            "executed_by": current_user.email
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menghapus data di database: {str(e)}"
        )

@router.post("/seed-dummy")
@router.get("/seed-dummy")
async def seed_dummy_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Seed 5 Siswa Dummy Lengkap & 4 Guru Dummy Lengkap
    """
    try:
        # 1. Seed 4 Guru
        gurus_data = [
            {
                "uid": "GR-1011",
                "nama": "Ust. Rian Hidayat, S.Pd",
                "nama_panggilan": "Rian",
                "umur": 28,
                "kategori_program": "Sempoa SIP",
                "paket_pengajaran": "Reguler",
                "hari_wajib": "Senin, Selasa, Kamis",
                "whatsapp_guru": "081234567811",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(1998, 5, 12),
                "asal_sekolah": "Universitas Negeri Padang",
                "mode_kelas": "OFFLINE",
                "foto_profil": "/uploads/guru_rian.png",
                "email": "rian.sempoa@gmail.com"
            },
            {
                "uid": "GR-2022",
                "nama": "Usth. Nurul Aini, Lc",
                "nama_panggilan": "Nurul",
                "umur": 26,
                "kategori_program": "Tahfidz",
                "paket_pengajaran": "Reguler",
                "hari_wajib": "Selasa, Kamis, Sabtu",
                "whatsapp_guru": "081234567812",
                "tempat_lahir": "Padang",
                "tanggal_lahir": date(2000, 8, 20),
                "asal_sekolah": "UIN Imam Bonjol",
                "mode_kelas": "OFFLINE",
                "foto_profil": "/uploads/guru_nurul.png",
                "email": "nurul.tahfidz@gmail.com"
            },
            {
                "uid": "GR-3033",
                "nama": "Mr. Kevin Sanjaya, B.Ed",
                "nama_panggilan": "Kevin",
                "umur": 29,
                "kategori_program": "Bahasa Inggris",
                "paket_pengajaran": "Reguler",
                "hari_wajib": "Sabtu, Minggu",
                "whatsapp_guru": "081234567813",
                "tempat_lahir": "Bukittinggi",
                "tanggal_lahir": date(1997, 11, 3),
                "asal_sekolah": "Universitas Andalas",
                "mode_kelas": "ONLINE",
                "foto_profil": "/uploads/guru_kevin.png",
                "email": "kevin.english@gmail.com"
            },
            {
                "uid": "GR-4044",
                "nama": "Ibu Dian Permatasari, S.Psi",
                "nama_panggilan": "Dian",
                "umur": 27,
                "kategori_program": "Fonem",
                "paket_pengajaran": "Reguler",
                "hari_wajib": "Senin, Rabu, Jumat",
                "whatsapp_guru": "081234567814",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(1999, 2, 14),
                "asal_sekolah": "Universitas Putra Indonesia",
                "mode_kelas": "OFFLINE",
                "foto_profil": "/uploads/guru_dian.png",
                "email": "dian.fonem@gmail.com"
            }
        ]

        for g_info in gurus_data:
            existing_g = db.query(Guru).filter(Guru.uid == g_info["uid"]).first()
            if not existing_g:
                guru = Guru(
                    uid=g_info["uid"],
                    nama=g_info["nama"],
                    nama_panggilan=g_info["nama_panggilan"],
                    umur=g_info["umur"],
                    kategori_program=g_info["kategori_program"],
                    paket_pengajaran=g_info["paket_pengajaran"],
                    hari_wajib=g_info["hari_wajib"],
                    whatsapp_guru=g_info["whatsapp_guru"],
                    tempat_lahir=g_info["tempat_lahir"],
                    tanggal_lahir=g_info["tanggal_lahir"],
                    asal_sekolah=g_info["asal_sekolah"],
                    mode_kelas=g_info["mode_kelas"],
                    foto_profil=g_info["foto_profil"]
                )
                db.add(guru)
                db.flush()

                existing_u = db.query(User).filter(User.email == g_info["email"]).first()
                if not existing_u:
                    user_guru = User(
                        email=g_info["email"],
                        password=get_password_hash("guru12345"),
                        role=UserRole.guru,
                        nama=g_info["nama"],
                        uid_terhubung=str(guru.id)
                    )
                    db.add(user_guru)
            else:
                existing_g.foto_profil = g_info["foto_profil"]

        # 2. Seed 5 Siswa
        students_data = [
            {
                "uid": "sp-0726",
                "nama": "Ahmad Farhan",
                "nama_panggilan": "Farhan",
                "umur": 7,
                "kelas_sekolah": "1 SD",
                "kategori_program": "Sempoa SIP",
                "paket_jadwal": "Paket 1: 8 Pertemuan, 90 Menit",
                "hari_masuk": "Senin, Kamis",
                "target_pertemuan": 8,
                "sisa_pertemuan": 6, # 75% -> Lancar
                "status_spp": StatusSPP.AKTIF,
                "nama_orang_tua": "Bpk. Rahmat Farhan",
                "whatsapp_orang_tua": "081234567801",
                "alamat": "Jl. Merdeka No. 12, Pariaman Tengah",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(2019, 3, 15),
                "asal_sekolah": "SDN 01 Pariaman",
                "days_ago": 10,
                "foto_profil": "/uploads/siswa_farhan.png",
                "email": "ortu.farhan@gmail.com"
            },
            {
                "uid": "sp-0826",
                "nama": "Siti Rahmah",
                "nama_panggilan": "Rahmah",
                "umur": 8,
                "kelas_sekolah": "2 SD",
                "kategori_program": "Sempoa SIP",
                "paket_jadwal": "Paket 2: 12 Pertemuan, 60 Menit",
                "hari_masuk": "Selasa, Jumat",
                "target_pertemuan": 12,
                "sisa_pertemuan": 4, # 33% -> Peringatan (Kuning <= 40%)
                "status_spp": StatusSPP.AKTIF,
                "nama_orang_tua": "Ibu Maryam",
                "whatsapp_orang_tua": "081234567802",
                "alamat": "Jl. Sudirman No. 45, Pariaman",
                "tempat_lahir": "Padang",
                "tanggal_lahir": date(2018, 6, 20),
                "asal_sekolah": "SD IT Mutiara",
                "days_ago": 18,
                "foto_profil": "/uploads/siswa_rahmah.png",
                "email": "ortu.rahmah@gmail.com"
            },
            {
                "uid": "fn-0526",
                "nama": "Bintang Pratama",
                "nama_panggilan": "Bintang",
                "umur": 5,
                "kelas_sekolah": "TK B",
                "kategori_program": "Fonem",
                "paket_jadwal": "Paket Reguler: 12 Pertemuan, 60 Menit",
                "hari_masuk": "Senin, Rabu, Jumat",
                "target_pertemuan": 12,
                "sisa_pertemuan": 2, # 16% -> Urgent (Merah < 20%)
                "status_spp": StatusSPP.AKTIF,
                "nama_orang_tua": "Bpk. Hendra Pratama",
                "whatsapp_orang_tua": "081234567803",
                "alamat": "Komp. Griya Pariaman Blok B3",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(2021, 2, 10),
                "asal_sekolah": "TK Kemala Bhayangkari",
                "days_ago": 24,
                "foto_profil": "/uploads/siswa_bintang.png",
                "email": "ortu.bintang@gmail.com"
            },
            {
                "uid": "bi-0926",
                "nama": "Aisyah Putri",
                "nama_panggilan": "Aisyah",
                "umur": 9,
                "kelas_sekolah": "3 SD",
                "kategori_program": "Bahasa Inggris",
                "paket_jadwal": "Paket Reguler: 2 Pertemuan, 90 Menit",
                "hari_masuk": "Sabtu, Minggu",
                "target_pertemuan": 2,
                "sisa_pertemuan": 0, # 0% -> Urgent / Habis
                "status_spp": StatusSPP.EXPIRED,
                "nama_orang_tua": "Ibu Fatimah",
                "whatsapp_orang_tua": "081234567804",
                "alamat": "Jl. Khatib Sulaiman No. 8",
                "tempat_lahir": "Bukittinggi",
                "tanggal_lahir": date(2017, 9, 5),
                "asal_sekolah": "SDN 03 Pariaman",
                "days_ago": 28,
                "foto_profil": "/uploads/siswa_aisyah.png",
                "email": "ortu.aisyah@gmail.com"
            },
            {
                "uid": "td-0626",
                "nama": "Muhammad Zaki",
                "nama_panggilan": "Zaki",
                "umur": 6,
                "kelas_sekolah": "TK B",
                "kategori_program": "Tahfidz",
                "paket_jadwal": "Paket Reguler: 12 Pertemuan, 60 Menit",
                "hari_masuk": "Selasa, Kamis",
                "target_pertemuan": 12,
                "sisa_pertemuan": 5, # Hangus (Lewat 30 hari)
                "status_spp": StatusSPP.EXPIRED,
                "nama_orang_tua": "Bpk. Zulkifli",
                "whatsapp_orang_tua": "081234567805",
                "alamat": "Desa Rawang, Pariaman Tengah",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(2020, 4, 12),
                "asal_sekolah": "TK Aisyiyah Pariaman",
                "days_ago": 42, # > 30 hari -> Hangus
                "foto_profil": "/uploads/siswa_zaki.png",
                "email": "ortu.zaki@gmail.com"
            }
        ]

        for s_info in students_data:
            existing_s = db.query(Siswa).filter(Siswa.uid == s_info["uid"]).first()
            reg_date = datetime.utcnow() - timedelta(days=s_info["days_ago"])
            
            if not existing_s:
                siswa = Siswa(
                    uid=s_info["uid"],
                    nama=s_info["nama"],
                    nama_panggilan=s_info["nama_panggilan"],
                    umur=s_info["umur"],
                    kelas_sekolah=s_info["kelas_sekolah"],
                    kategori_program=s_info["kategori_program"],
                    paket_jadwal=s_info["paket_jadwal"],
                    hari_masuk=s_info["hari_masuk"],
                    target_pertemuan=s_info["target_pertemuan"],
                    sisa_pertemuan=s_info["sisa_pertemuan"],
                    status_spp=s_info["status_spp"],
                    nama_orang_tua=s_info["nama_orang_tua"],
                    whatsapp_orang_tua=s_info["whatsapp_orang_tua"],
                    alamat=s_info["alamat"],
                    tempat_lahir=s_info["tempat_lahir"],
                    tanggal_lahir=s_info["tanggal_lahir"],
                    asal_sekolah=s_info["asal_sekolah"],
                    foto_profil=s_info["foto_profil"],
                    created_at=reg_date,
                    is_deleted=False
                )
                db.add(siswa)
                db.flush()

                nominal = 350000.00 if "sempoa" in s_info["kategori_program"].lower() else 200000.00
                due_date = reg_date.date() + timedelta(days=30)
                pembayaran = PembayaranPeriode(
                    id_siswa=siswa.id,
                    periode_bulan=reg_date.strftime("%Y-%m"),
                    jumlah=nominal,
                    status=StatusPembayaran.LUNAS if s_info["days_ago"] <= 30 else StatusPembayaran.OVERDUE,
                    due_date=due_date,
                    created_at=reg_date
                )
                db.add(pembayaran)

                existing_u = db.query(User).filter(User.email == s_info["email"]).first()
                if not existing_u:
                    user_ortu = User(
                        email=s_info["email"],
                        password=get_password_hash("ortu12345"),
                        role=UserRole.ortu,
                        nama=s_info["nama_orang_tua"],
                        uid_terhubung=str(siswa.id)
                    )
                    db.add(user_ortu)
            else:
                existing_s.foto_profil = s_info["foto_profil"]

        db.commit()
        return {
            "status": "success",
            "message": "5 Dummy Siswa & 4 Dummy Guru berhasil diisi lengkap dengan foto dan status variatif!"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Gagal melakukan seed dummy: {str(e)}"
        )
