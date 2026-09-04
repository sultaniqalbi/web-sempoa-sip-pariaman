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
from app.models.bukti_transfer import BuktiTransfer, StatusBuktiTransfer
from app.models.galeri import Galeri
from app.models.audit_log import AuditLog
from app.models.catatan_pembelajaran import CatatanPembelajaran
from app.models.keuangan import Keuangan
from app.models.pendaftaran_baru import PendaftaranBaru
from app.services.audit_service import log_activity
from fastapi.responses import Response
from sqlalchemy import func, extract, or_, String
import csv
import io
from pydantic import BaseModel

router = APIRouter()
owner_only = RoleChecker([UserRole.owner])
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

class RekapBulananRequest(BaseModel):
    bulan: str  # YYYY-MM

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
    Hanya menghitung pembayaran yang bukti pembayarannya telah disetujui (di-ACC).
    Pendapatan per program dipisahkan secara murni per program resmi.
    """
    if not bulan:
        bulan = datetime.utcnow().strftime("%Y-%m")

    # 1. Subquery pembayaran yang telah diverifikasi (memiliki BuktiTransfer approved)
    verified_pay_subq = (
        db.query(BuktiTransfer.id_pembayaran)
        .filter(BuktiTransfer.status == StatusBuktiTransfer.approved)
        .subquery()
    )

    # 2. Total revenue for specified month (Hanya pembayaran LUNAS yang bukti transfernya telah disetujui)
    revenue_q = (
        db.query(func.sum(PembayaranPeriode.jumlah))
        .filter(
            PembayaranPeriode.periode_bulan == bulan,
            PembayaranPeriode.status == StatusPembayaran.LUNAS,
            PembayaranPeriode.id.in_(verified_pay_subq)
        )
        .scalar()
    )
    total_pendapatan = float(revenue_q or 0.0)

    # 3. Breakdown per status tagihan siswa pada bulan yang dipilih
    status_q = (
        db.query(PembayaranPeriode.status, func.count(PembayaranPeriode.id))
        .filter(PembayaranPeriode.periode_bulan == bulan)
        .group_by(PembayaranPeriode.status)
        .all()
    )
    per_status = [{"status": s.value, "jumlah": c} for s, c in status_q]

    # 4. Revenue per program (Dipisah murni per program resmi: Sempoa SIP, Fonem, Tahfidz, Bahasa Inggris, TK)
    from app.models.program_setting import ProgramSetting
    program_settings = db.query(ProgramSetting).all()
    program_tariffs = {}
    for ps in program_settings:
        program_tariffs[ps.nama_program.strip()] = float(ps.biaya_spp)

    defaults = {
        "Sempoa SIP": 350000.0,
        "Fonem": 200000.0,
        "Tahfidz": 200000.0,
        "Bahasa Inggris": 200000.0,
        "TK": 400000.0
    }
    for k, v in defaults.items():
        if k not in program_tariffs:
            program_tariffs[k] = v

    # Inisialisasi peta pendapatan tiap program
    program_revenue_map = {p: 0.0 for p in program_tariffs.keys()}

    # Ambil semua pembayaran terverifikasi bulan ini beserta data siswa
    verified_payments = (
        db.query(PembayaranPeriode, Siswa)
        .join(Siswa, Siswa.id == PembayaranPeriode.id_siswa)
        .filter(
            PembayaranPeriode.periode_bulan == bulan,
            PembayaranPeriode.status == StatusPembayaran.LUNAS,
            PembayaranPeriode.id.in_(verified_pay_subq),
            Siswa.is_deleted == False
        )
        .all()
    )

    for pay, siswa in verified_payments:
        raw_programs = [p.strip() for p in (siswa.kategori_program or "").split(",") if p.strip()]
        if not raw_programs:
            raw_programs = ["Sempoa SIP"]

        # Cocokkan dengan nama program resmi (case-insensitive)
        matched_programs = []
        for p in raw_programs:
            found = False
            for off_prog in program_tariffs.keys():
                if off_prog.lower() == p.lower():
                    matched_programs.append(off_prog)
                    found = True
                    break
            if not found:
                matched_programs.append(p)
                if p not in program_revenue_map:
                    program_revenue_map[p] = 0.0

        pay_amount = float(pay.jumlah or 0.0)

        if len(matched_programs) == 1:
            prog_name = matched_programs[0]
            program_revenue_map[prog_name] = program_revenue_map.get(prog_name, 0.0) + pay_amount
        else:
            # Multi-program: Bagi proporsional berdasarkan tarif resmi masing-masing program
            sum_tariffs = sum(program_tariffs.get(p, 200000.0) for p in matched_programs)
            if sum_tariffs > 0:
                for p in matched_programs:
                    share = (program_tariffs.get(p, 200000.0) / sum_tariffs) * pay_amount
                    program_revenue_map[p] = program_revenue_map.get(p, 0.0) + share
            else:
                equal_share = pay_amount / len(matched_programs)
                for p in matched_programs:
                    program_revenue_map[p] = program_revenue_map.get(p, 0.0) + equal_share

    # Susun list per_program tanpa ada nama gabungan (koma)
    per_program = [
        {"program": prog, "pendapatan": round(amt, 2)}
        for prog, amt in program_revenue_map.items()
        if amt > 0 or prog in defaults
    ]

    # Urutkan agar Sempoa SIP selalu di awal
    def sort_key(item):
        p = item["program"].lower()
        if "sempoa" in p: return 0
        if "fonem" in p: return 1
        if "tahfidz" in p: return 2
        if "inggris" in p: return 3
        if "tk" in p: return 4
        return 5
    per_program.sort(key=sort_key)

    # 5. Tren 6 Bulan (Hanya pembayaran terverifikasi di-ACC)
    all_periodes = (
        db.query(PembayaranPeriode.periode_bulan, func.sum(PembayaranPeriode.jumlah))
        .filter(
            PembayaranPeriode.status == StatusPembayaran.LUNAS,
            PembayaranPeriode.id.in_(verified_pay_subq)
        )
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


@router.post("/seed-dummy")
@router.get("/seed-dummy")
async def seed_dummy_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Seed 5 Siswa Dummy Lengkap & 4 Guru Dummy Lengkap (Hanya aktif di Mode Development)
    """
    from app.core.config import settings
    if settings.fastapi_env == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Fitur seed data dummy dinonaktifkan pada lingkungan produksi demi keamanan database."
        )
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
        logger.error(f"Gagal melakukan seed dummy: {e}", exc_info=True)
        if settings.fastapi_env == "production":
            raise HTTPException(
                status_code=500,
                detail="Terjadi kesalahan internal server saat melakukan seed data dummy."
            )
        raise HTTPException(
            status_code=500,
            detail=f"Gagal melakukan seed dummy: {str(e)}"
        )


class ProgramSettingUpdate(BaseModel):
    biaya_spp: float
    target_pertemuan: Optional[int] = None
    jam_mulai: Optional[str] = None
    jam_selesai: Optional[str] = None
    hari_masuk: Optional[str] = None
    keterangan: Optional[str] = None


@router.get("/spp-programs")
async def get_spp_programs(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Daftar program dan tarif SPP resmi lembaga untuk Admin dan Owner.
    """
    from app.models.program_setting import ProgramSetting
    programs = db.query(ProgramSetting).order_by(ProgramSetting.id.asc()).all()
    if not programs:
        from app.core.constants import PROGRAM_CONFIG
        for p_name, p_info in PROGRAM_CONFIG.items():
            ps = ProgramSetting(
                nama_program=p_name,
                biaya_spp=p_info.get("biaya_spp", 200000.0),
                target_pertemuan=p_info.get("default_target_pertemuan", 12),
                jam_mulai=p_info.get("jam_default", {}).get("mulai", "08:00"),
                jam_selesai=p_info.get("jam_default", {}).get("selesai", "12:00"),
                hari_masuk=p_info.get("hari_masuk", "Senin - Jumat"),
                keterangan=f"Program Resmi {p_name}"
            )
            db.add(ps)
        db.commit()
        programs = db.query(ProgramSetting).order_by(ProgramSetting.id.asc()).all()

    return [
        {
            "id": p.id,
            "nama_program": p.nama_program,
            "biaya_spp": float(p.biaya_spp),
            "target_pertemuan": p.target_pertemuan,
            "jam_mulai": p.jam_mulai or "-",
            "jam_selesai": p.jam_selesai or "-",
            "hari_masuk": p.hari_masuk or "-",
            "keterangan": p.keterangan or "-",
            "updated_at": p.updated_at.isoformat() if p.updated_at else None
        }
        for p in programs
    ]


@router.put("/spp-programs/{id}")
async def update_spp_program(
    id: int,
    payload: ProgramSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Update tarif SPP dan detail program oleh Admin atau Owner.
    """
    from app.models.program_setting import ProgramSetting
    setting = db.query(ProgramSetting).filter(ProgramSetting.id == id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Program tidak ditemukan")

    if payload.biaya_spp < 0:
        raise HTTPException(status_code=400, detail="Nominal SPP tidak boleh bernilai negatif")

    setting.biaya_spp = payload.biaya_spp
    if payload.target_pertemuan is not None and payload.target_pertemuan > 0:
        setting.target_pertemuan = payload.target_pertemuan
    if payload.jam_mulai:
        setting.jam_mulai = payload.jam_mulai.strip()
    if payload.jam_selesai:
        setting.jam_selesai = payload.jam_selesai.strip()
    if payload.hari_masuk:
        setting.hari_masuk = payload.hari_masuk.strip()
    if payload.keterangan is not None:
        setting.keterangan = payload.keterangan.strip()

    db.commit()
    db.refresh(setting)

    # Log activity
    log_activity(
        db=db,
        action="PERUBAHAN",
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        email=current_user.email,
        modul="Pengaturan SPP",
        deskripsi=f"Mengubah tarif SPP {setting.nama_program} menjadi Rp {float(setting.biaya_spp):,.0f}",
        status="SUCCESS",
        target_id=setting.id,
        target_nama=setting.nama_program,
        after={"biaya_spp": float(setting.biaya_spp), "target_pertemuan": setting.target_pertemuan}
    )

    # Broadcast notification to portals that pricing updated
    try:
        from app.core.websocket import manager
        manager.broadcast_sync("DATA_UPDATE", {
            "type": "SPP_PROGRAM_UPDATED",
            "program": setting.nama_program,
            "biaya_spp": float(setting.biaya_spp)
        })
    except Exception:
        pass

    return {
        "status": "success",
        "message": f"Tarif SPP untuk {setting.nama_program} berhasil diperbarui menjadi Rp {float(setting.biaya_spp):,.0f}",
        "data": {
            "id": setting.id,
            "nama_program": setting.nama_program,
            "biaya_spp": float(setting.biaya_spp),
            "target_pertemuan": setting.target_pertemuan,
            "jam_mulai": setting.jam_mulai,
            "jam_selesai": setting.jam_selesai,
            "hari_masuk": setting.hari_masuk
        }
    }


@router.get("/riwayat")
async def get_riwayat_aktivitas(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    action: Optional[str] = None,
    modul: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Riwayat & Log Aktivitas Sistem (Audit Trail Lengkap)
    """
    query = db.query(AuditLog)

    # Filter jenis aksi (Penambahan, Perubahan, Penghapusan, Verifikasi, dll)
    if action and action.upper() != "SEMUA":
        query = query.filter(func.upper(AuditLog.action) == action.upper())

    # Filter role pelaksana (admin, guru, ortu, owner)
    if role and role.lower() != "semua":
        query = query.filter(func.lower(AuditLog.role) == role.lower())

    # Filter status aksi (SUCCESS / FAILED)
    if status and status.upper() != "SEMUA":
        query = query.filter(func.upper(AuditLog.status) == status.upper())

    # Filter rentang tanggal
    if start_date:
        try:
            s_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(AuditLog.timestamp >= s_dt)
        except Exception:
            pass
    if end_date:
        try:
            e_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(AuditLog.timestamp < e_dt)
        except Exception:
            pass

    # Filter modul (Siswa, Guru, Keuangan, Absensi, Buku, dll)
    if modul and modul.lower() != "semua":
        query = query.filter(func.cast(AuditLog.details, String).ilike(f"%{modul}%"))

    # Pencarian teks (email, aksi, atau detail payload)
    if q and q.strip():
        search_kw = f"%{q.strip()}%"
        query = query.filter(
            or_(
                AuditLog.email.ilike(search_kw),
                AuditLog.action.ilike(search_kw),
                func.cast(AuditLog.details, String).ilike(search_kw)
            )
        )

    # Statistik ringkasan seluruh log audit
    total_aktivitas = db.query(AuditLog).count()
    total_penambahan = db.query(AuditLog).filter(func.upper(AuditLog.action) == "PENAMBAHAN").count()
    total_perubahan = db.query(AuditLog).filter(func.upper(AuditLog.action) == "PERUBAHAN").count()
    total_penghapusan = db.query(AuditLog).filter(func.upper(AuditLog.action) == "PENGHAPUSAN").count()
    total_verifikasi = db.query(AuditLog).filter(func.upper(AuditLog.action) == "VERIFIKASI").count()

    total_filtered = query.count()
    total_pages = (total_filtered + limit - 1) // limit if total_filtered > 0 else 1

    logs = (
        query.order_by(AuditLog.timestamp.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    formatted_logs = []
    for log in logs:
        dt = log.details or {}
        deskripsi = dt.get("deskripsi") or f"Aktivitas {log.action}"
        modul_name = dt.get("modul") or "Umum"
        formatted_logs.append({
            "id": log.id,
            "action": log.action,
            "jenis": log.action,
            "status": log.status,
            "role": log.role,
            "email": log.email,
            "user_name": dt.get("nama_user") or log.email.split("@")[0].capitalize(),
            "modul": modul_name,
            "perubahan": deskripsi,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "details": dt,
            "ip_address": dt.get("ip_address"),
            "target_id": dt.get("target_id"),
            "target_nama": dt.get("target_nama")
        })

    return {
        "total": total_filtered,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "summary": {
            "total_aktivitas": total_aktivitas,
            "total_penambahan": total_penambahan,
            "total_perubahan": total_perubahan,
            "total_penghapusan": total_penghapusan,
            "total_verifikasi": total_verifikasi
        },
        "logs": formatted_logs
    }


@router.get("/riwayat/export")
async def export_riwayat_csv(
    q: Optional[str] = None,
    action: Optional[str] = None,
    modul: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Export Riwayat Aktivitas ke file CSV
    """
    query = db.query(AuditLog)
    if action and action.upper() != "SEMUA":
        query = query.filter(func.upper(AuditLog.action) == action.upper())
    if role and role.lower() != "semua":
        query = query.filter(func.lower(AuditLog.role) == role.lower())
    if status and status.upper() != "SEMUA":
        query = query.filter(func.upper(AuditLog.status) == status.upper())
    if start_date:
        try:
            s_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(AuditLog.timestamp >= s_dt)
        except Exception:
            pass
    if end_date:
        try:
            e_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(AuditLog.timestamp < e_dt)
        except Exception:
            pass
    if modul and modul.lower() != "semua":
        query = query.filter(func.cast(AuditLog.details, String).ilike(f"%{modul}%"))
    if q and q.strip():
        search_kw = f"%{q.strip()}%"
        query = query.filter(
            or_(
                AuditLog.email.ilike(search_kw),
                AuditLog.action.ilike(search_kw),
                func.cast(AuditLog.details, String).ilike(search_kw)
            )
        )

    logs = query.order_by(AuditLog.timestamp.desc()).limit(2000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["No", "ID", "Jenis Aksi", "Status", "Role User", "Email User", "Modul", "Detail Perubahan", "Waktu / Tanggal"])

    for idx, log in enumerate(logs, 1):
        dt = log.details or {}
        deskripsi = dt.get("deskripsi") or f"Aktivitas {log.action}"
        modul_name = dt.get("modul") or "Umum"
        waktu_str = log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "-"
        writer.writerow([idx, log.id, log.action, log.status, log.role, log.email, modul_name, deskripsi, waktu_str])

    csv_data = output.getvalue()
    filename = f"riwayat_aktivitas_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

