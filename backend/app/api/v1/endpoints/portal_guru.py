from typing import List, Dict, Any, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.siswa import Siswa, StatusSPP
from app.models.absensi_log import AbsensiLog, StatusAbsensi, ModeAbsensi
from app.models.jadwal import Jadwal
from app.models.catatan_pembelajaran import CatatanPembelajaran

router = APIRouter()
teacher_only = RoleChecker([UserRole.guru])

@router.get("/dashboard")
async def get_guru_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    if not current_user.uid_terhubung:
        raise HTTPException(status_code=404, detail="Data guru tidak terhubung")

    try:
        guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    except (ValueError, TypeError):
        guru = db.query(Guru).filter(Guru.uid == str(current_user.uid_terhubung)).first()

    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    # Get active students for this teacher or matching teacher's program
    active_students = db.query(Siswa).filter(
        or_(
            Siswa.id_guru == guru.id,
            func.lower(Siswa.kategori_program) == func.lower(guru.kategori_program or "Sempoa SIP")
        ),
        Siswa.status_spp == StatusSPP.AKTIF,
        Siswa.is_deleted == False
    ).all()

    total_siswa = len(active_students)
    today = datetime.now().date()

    # Find teacher's latest attendance tap
    last_tap = db.query(AbsensiLog).filter(
        AbsensiLog.uid == guru.uid,
        func.date(AbsensiLog.waktu) == today
    ).order_by(AbsensiLog.waktu.desc()).first()

    status_val = "Belum Absen"
    if last_tap:
        status_val = last_tap.status.value if hasattr(last_tap.status, 'value') else str(last_tap.status)

    absensi_guru = {
        "status": status_val,
        "tanggal": last_tap.waktu.strftime("%d-%m") if last_tap else today.strftime("%d-%m"),
        "jam": last_tap.waktu.strftime("%H:%M") if last_tap else "-"
    }

    # Jadwal hari ini
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    hari_ini = days[today.weekday()]
    is_active_today = hari_ini in (guru.hari_wajib or "")

    # Find actual schedule if available
    jadwal_row = db.query(Jadwal).filter(
        or_(
            Jadwal.id_guru == guru.id,
            func.lower(Jadwal.kategori_program) == func.lower(guru.kategori_program or "Sempoa SIP")
        )
    ).first()

    jam_mulai_str = str(jadwal_row.jam_mulai) if jadwal_row and jadwal_row.jam_mulai else "08:30"
    jam_selesai_str = str(jadwal_row.jam_selesai) if jadwal_row and jadwal_row.jam_selesai else "11:30"
    ruangan_str = str(jadwal_row.lokasi) if jadwal_row and jadwal_row.lokasi else "Ruang Kelas A"

    jadwal_hari_ini = {
        "kode_program": "SEMPOA",
        "nama_program": guru.kategori_program or "Sempoa SIP",
        "jam_mulai": jam_mulai_str,
        "jam_selesai": jam_selesai_str,
        "ruangan": ruangan_str,
        "jumlah_siswa": total_siswa,
        "is_active_today": is_active_today
    }

    # Count real students marked today
    hadir_count = 0
    absen_count = 0
    uids_program = [s.uid for s in active_students]
    if uids_program:
        logs_today = db.query(AbsensiLog).filter(
            AbsensiLog.uid.in_(uids_program),
            func.date(AbsensiLog.waktu) == today
        ).all()
        for l in logs_today:
            s_str = l.status.value if hasattr(l.status, 'value') else str(l.status).lower()
            if "hadir" in s_str:
                hadir_count += 1
            else:
                absen_count += 1

    # Latest learning note for this program / teacher
    latest_note = db.query(CatatanPembelajaran).filter(
        or_(
            CatatanPembelajaran.id_guru == guru.id,
            func.lower(CatatanPembelajaran.kategori_program) == func.lower(guru.kategori_program or "")
        )
    ).order_by(CatatanPembelajaran.created_at.desc()).first()

    catatan_terbaru = None
    if latest_note:
        catatan_terbaru = {
            "id": latest_note.id,
            "tanggal": latest_note.tanggal.strftime("%d %B %Y") if latest_note.tanggal else "",
            "catatan": latest_note.catatan,
            "waktu": latest_note.created_at.strftime("%H:%M") if latest_note.created_at else ""
        }

    return {
        "guru": {
            "id": guru.id,
            "nama_guru": guru.nama,
            "uid_rfid": guru.uid,
            "program": guru.kategori_program or "Sempoa SIP",
            "foto_profil": guru.foto_profil,
            "no_wa": guru.whatsapp_guru,
            "mode_kelas": guru.mode_kelas or "OFFLINE"
        },
        "jadwal_hari_ini": jadwal_hari_ini,
        "absensi_guru": absensi_guru,
        "absensi_siswa": {
            "total_siswa": total_siswa,
            "jumlah_hadir": hadir_count,
            "jumlah_absen": absen_count
        },
        "mode_kelas": guru.mode_kelas or "OFFLINE",
        "catatan_terbaru": catatan_terbaru
    }

class ModeKelasUpdate(BaseModel):
    mode_kelas: str

@router.put("/kelas/mode")
async def update_mode_kelas(
    payload: ModeKelasUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    mode = payload.mode_kelas.upper()
    if mode not in ["ONLINE", "OFFLINE"]:
        mode = "OFFLINE"

    guru.mode_kelas = mode
    db.commit()
    db.refresh(guru)

    return {"status": "success", "mode_kelas": guru.mode_kelas}

@router.get("/kelas-bimbingan")
async def get_kelas_bimbingan(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")
        
    total_siswa = db.query(Siswa).filter(
        or_(
            Siswa.id_guru == guru.id,
            func.lower(Siswa.kategori_program) == func.lower(guru.kategori_program or "Sempoa SIP")
        ),
        Siswa.status_spp == StatusSPP.AKTIF,
        Siswa.is_deleted == False
    ).count()

    return {
        "kelas": [
            {
                "kode_program": "SEMPOA",
                "nama_program": guru.kategori_program or "Sempoa SIP",
                "waktu": "08:30 - 11:30 WIB",
                "ruangan": "Ruang Kelas A",
                "hari": guru.hari_wajib or "Senin, Rabu, Kamis",
                "jumlah_siswa": total_siswa,
                "paket": guru.paket_pengajaran or "Reguler",
                "mode_kelas": guru.mode_kelas or "OFFLINE"
            }
        ]
    }

@router.get("/absensi/list")
async def get_absensi_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    logs = db.query(AbsensiLog).filter(AbsensiLog.uid == guru.uid).order_by(AbsensiLog.waktu.desc()).limit(15).all()
    
    result = []
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    for log in logs:
        hari = days[log.waktu.weekday()]
        tanggal_str = f"{hari}, {log.waktu.strftime('%d %b %Y')}"
        waktu_str = log.waktu.strftime("%H:%M")
        status_name = log.status.value if hasattr(log.status, 'value') else str(log.status)
        result.append({
            "uid_rfid": log.uid,
            "waktu_tap": f"{waktu_str} WIB ({tanggal_str})",
            "status": "Hadir" if "hadir" in status_name.lower() else status_name
        })
        
    return {"logs": result}

@router.get("/siswa-absensi")
async def get_siswa_absensi(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    students = db.query(Siswa).filter(
        or_(
            Siswa.id_guru == guru.id,
            func.lower(Siswa.kategori_program) == func.lower(guru.kategori_program or "Sempoa SIP")
        ),
        Siswa.is_deleted == False
    ).order_by(Siswa.nama).all()

    today = datetime.now().date()
    now_str = datetime.now().strftime("%d %b %Y, %H:%M WIB")
    
    # Query today's logs for these students
    uids = [s.uid for s in students]
    logs_map = {}
    if uids:
        today_logs = db.query(AbsensiLog).filter(
            AbsensiLog.uid.in_(uids),
            func.date(AbsensiLog.waktu) == today
        ).order_by(AbsensiLog.waktu.desc()).all()
        for l in today_logs:
            if l.uid not in logs_map:
                s_name = l.status.value if hasattr(l.status, 'value') else str(l.status)
                logs_map[l.uid] = {
                    "status": s_name.lower(),
                    "jam": l.waktu.strftime("%H:%M WIB")
                }
    
    result = []
    for i, s in enumerate(students, 1):
        panggilan = s.nama_panggilan if s.nama_panggilan else (s.nama.split()[0] if s.nama else "")
        pertemuan_selesai = s.target_pertemuan - s.sisa_pertemuan
        today_log = logs_map.get(s.uid)
        result.append({
            "no": i,
            "id": s.id,
            "uid": s.uid,
            "nama_lengkap": s.nama,
            "panggilan": panggilan,
            "pertemuan_selesai": pertemuan_selesai,
            "total_pertemuan": s.target_pertemuan,
            "is_disabled": s.sisa_pertemuan <= 0,
            "foto_profil": s.foto_profil,
            "kelas_sekolah": s.kelas_sekolah,
            "asal_sekolah": s.asal_sekolah,
            "tanggal_lengkap": now_str,
            "status_hari_ini": today_log["status"] if today_log else None,
            "jam_tap_hari_ini": today_log["jam"] if today_log else None
        })
        
    return {
        "tanggal_hari_ini": datetime.now().strftime("%A, %d %B %Y"),
        "siswa": result
    }

class SiswaAbsensiItem(BaseModel):
    siswa_id: int
    status: str

class SiswaAbsensiSubmit(BaseModel):
    siswa_absensi: List[SiswaAbsensiItem]
    catatan_pembelajaran: Optional[str] = None
    tanggal: Optional[str] = None

@router.post("/absensi/simpan")
async def save_siswa_absensi(
    data: SiswaAbsensiSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    status_map = {
        "hadir": StatusAbsensi.HADIR,
        "izin": StatusAbsensi.IZIN,
        "absen": StatusAbsensi.ALFA
    }

    now = datetime.now()
    if data.tanggal:
        try:
            target_date = datetime.strptime(data.tanggal, "%Y-%m-%d").date()
            now = datetime.combine(target_date, datetime.now().time())
        except Exception:
            pass

    saved_count = 0

    for item in data.siswa_absensi:
        siswa = db.query(Siswa).filter(
            Siswa.id == item.siswa_id,
            or_(
                Siswa.id_guru == guru.id,
                func.lower(Siswa.kategori_program) == func.lower(guru.kategori_program or "Sempoa SIP")
            ),
            Siswa.is_deleted == False
        ).first()
        if not siswa:
            continue
            
        if siswa.sisa_pertemuan <= 0:
            continue
            
        status_enum = status_map.get(item.status.lower(), StatusAbsensi.HADIR)
        
        # Check if already marked on this date to update rather than duplicate
        existing_log = db.query(AbsensiLog).filter(
            AbsensiLog.uid == siswa.uid,
            func.date(AbsensiLog.waktu) == now.date()
        ).first()

        if existing_log:
            existing_log.status = status_enum
            existing_log.waktu = now
        else:
            log = AbsensiLog(
                uid=siswa.uid,
                waktu=now,
                mode=ModeAbsensi.ONLINE,
                status=status_enum
            )
            db.add(log)
            if status_enum in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                siswa.sisa_pertemuan -= 1
             
        saved_count += 1

    # Save catatan pembelajaran if provided
    if data.catatan_pembelajaran and data.catatan_pembelajaran.strip():
        catatan_entry = CatatanPembelajaran(
            id_guru=guru.id,
            kategori_program=guru.kategori_program or "Sempoa SIP",
            tanggal=now.date(),
            catatan=data.catatan_pembelajaran.strip()
        )
        db.add(catatan_entry)
        
    db.commit()
    
    return {
        "status": "success",
        "message": f"Berhasil menyimpan absensi untuk {saved_count} siswa"
    }

@router.get("/rekap-absensi")
async def get_rekap_absensi(
    tanggal: str = Query(..., description="Format YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    try:
        filter_date = datetime.strptime(tanggal, "%Y-%m-%d").date()
    except ValueError:
        filter_date = datetime.now().date()

    students = db.query(Siswa).filter(
        or_(
            Siswa.id_guru == guru.id,
            func.lower(Siswa.kategori_program) == func.lower(guru.kategori_program or "Sempoa SIP")
        ),
        Siswa.is_deleted == False
    ).order_by(Siswa.nama).all()

    uids = [s.uid for s in students]
    logs_map = {}
    if uids:
        date_logs = db.query(AbsensiLog).filter(
            AbsensiLog.uid.in_(uids),
            func.date(AbsensiLog.waktu) == filter_date
        ).order_by(AbsensiLog.waktu.desc()).all()
        for l in date_logs:
            if l.uid not in logs_map:
                s_name = l.status.value if hasattr(l.status, 'value') else str(l.status)
                logs_map[l.uid] = {
                    "status": s_name,
                    "jam": l.waktu.strftime("%H:%M WIB")
                }

    # Fetch notes on that date
    note_row = db.query(CatatanPembelajaran).filter(
        or_(
            CatatanPembelajaran.id_guru == guru.id,
            func.lower(CatatanPembelajaran.kategori_program) == func.lower(guru.kategori_program or "")
        ),
        CatatanPembelajaran.tanggal == filter_date
    ).order_by(CatatanPembelajaran.created_at.desc()).first()

    rekap_list = []
    hadir_total = 0
    absen_total = 0
    izin_total = 0
    
    for i, s in enumerate(students, 1):
        panggilan = s.nama_panggilan if s.nama_panggilan else (s.nama.split()[0] if s.nama else "")
        log_info = logs_map.get(s.uid)
        status_display = log_info["status"] if log_info else "Belum Diabsen"
        
        if log_info:
            s_lower = status_display.lower()
            if "hadir" in s_lower:
                hadir_total += 1
            elif "izin" in s_lower:
                izin_total += 1
            else:
                absen_total += 1

        rekap_list.append({
            "no": i,
            "id": s.id,
            "uid": s.uid,
            "nama_lengkap": s.nama,
            "panggilan": panggilan,
            "program": s.kategori_program,
            "asal_sekolah": s.asal_sekolah,
            "kelas_sekolah": s.kelas_sekolah,
            "foto_profil": s.foto_profil,
            "waktu_tap": log_info["jam"] if log_info else "-",
            "status": status_display
        })

    return {
        "tanggal": filter_date.strftime("%Y-%m-%d"),
        "tanggal_formatted": filter_date.strftime("%A, %d %B %Y"),
        "stats": {
            "total_siswa": len(students),
            "hadir": hadir_total,
            "izin": izin_total,
            "absen": absen_total,
            "belum": len(students) - (hadir_total + izin_total + absen_total)
        },
        "catatan_pembelajaran": note_row.catatan if note_row else None,
        "rekap": rekap_list
    }
