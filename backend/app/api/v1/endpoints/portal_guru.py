from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.siswa import Siswa, StatusSPP
from app.models.absensi_log import AbsensiLog, StatusAbsensi, ModeAbsensi
from app.models.jadwal import Jadwal

router = APIRouter()
teacher_only = RoleChecker([UserRole.guru])

@router.get("/dashboard")
async def get_guru_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    # Get active students for this teacher
    active_students = db.query(Siswa).filter(
        Siswa.id_guru == guru.id,
        Siswa.status_spp == StatusSPP.AKTIF,
        Siswa.is_deleted == False
    ).all()

    total_siswa = len(active_students)
    
    # Simple stats for today
    today = datetime.now().date()
    # Find teacher's latest attendance tap
    last_tap = db.query(AbsensiLog).filter(
        AbsensiLog.uid == guru.uid,
        func.date(AbsensiLog.waktu) == today
    ).order_by(AbsensiLog.waktu.desc()).first()

    absensi_guru = {
        "status": last_tap.status.value if last_tap else "Belum Absen",
        "tanggal": last_tap.waktu.strftime("%d-%m") if last_tap else today.strftime("%d-%m"),
        "jam": last_tap.waktu.strftime("%H:%M") if last_tap else "-"
    }

    # Jadwal hari ini (mock based on current day)
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    hari_ini = days[today.weekday()]
    
    # Check if teacher teaches today
    is_active_today = hari_ini in (guru.hari_wajib or "")
    
    jadwal_hari_ini = {
        "kode_program": "SEMPOA",
        "nama_program": guru.kategori_program,
        "jam_mulai": "08:30",
        "jam_selesai": "11:30",
        "ruangan": "Ruang Kelas A",
        "jumlah_siswa": total_siswa,
        "is_active_today": is_active_today
    }

    return {
        "guru": {
            "nama_guru": guru.nama,
            "uid_rfid": guru.uid,
            "program": guru.kategori_program
        },
        "jadwal_hari_ini": jadwal_hari_ini,
        "absensi_guru": absensi_guru,
        "absensi_siswa": {
            "total_siswa": total_siswa,
            "jumlah_hadir": 0, # Could be calculated from today's student logs
            "jumlah_absen": 0
        }
    }


@router.get("/kelas-bimbingan")
async def get_kelas_bimbingan(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")
        
    total_siswa = db.query(Siswa).filter(
        Siswa.id_guru == guru.id,
        Siswa.status_spp == StatusSPP.AKTIF,
        Siswa.is_deleted == False
    ).count()

    return {
        "kelas": [
            {
                "kode_program": "SEMPOA",
                "nama_program": guru.kategori_program,
                "waktu": "08:30 - 11:30",
                "ruangan": "Ruang Kelas A",
                "hari": guru.hari_wajib or "Senin, Rabu",
                "jumlah_siswa": total_siswa,
                "paket": guru.paket_pengajaran or "Reguler"
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

    logs = db.query(AbsensiLog).filter(AbsensiLog.uid == guru.uid).order_by(AbsensiLog.waktu.desc()).limit(10).all()
    
    result = []
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    for log in logs:
        hari = days[log.waktu.weekday()]
        tanggal_str = f"{hari}, {log.waktu.strftime('%d %b')}"
        waktu_str = log.waktu.strftime("%H:%M")
        result.append({
            "uid_rfid": log.uid,
            "waktu_tap": f"{waktu_str} ({tanggal_str})",
            "status": "✅ Hadir" if log.status == StatusAbsensi.HADIR else f"❌ {log.status.value}"
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
        Siswa.id_guru == guru.id,
        Siswa.is_deleted == False
    ).order_by(Siswa.nama).all()
    
    result = []
    for i, s in enumerate(students, 1):
        # panggilan extraction (simple logic: first word)
        panggilan = s.nama.split()[0] if s.nama else ""
        pertemuan_selesai = s.target_pertemuan - s.sisa_pertemuan
        result.append({
            "no": i,
            "id": s.id,
            "uid": s.uid,
            "nama_lengkap": s.nama,
            "panggilan": panggilan,
            "pertemuan_selesai": pertemuan_selesai,
            "total_pertemuan": s.target_pertemuan,
            "is_disabled": s.sisa_pertemuan <= 0
        })
        
    return {"siswa": result}

class SiswaAbsensiItem(BaseModel):
    siswa_id: int
    status: str

class SiswaAbsensiSubmit(BaseModel):
    siswa_absensi: List[SiswaAbsensiItem]

@router.post("/absensi/simpan")
async def save_siswa_absensi(
    data: SiswaAbsensiSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = db.query(Guru).filter(Guru.id == int(current_user.uid_terhubung)).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    # Map status string to StatusAbsensi enum
    status_map = {
        "hadir": StatusAbsensi.HADIR,
        "izin": StatusAbsensi.IZIN,
        "absen": StatusAbsensi.ALFA
    }

    now = datetime.now()
    saved_count = 0

    for item in data.siswa_absensi:
        # verify student belongs to teacher
        siswa = db.query(Siswa).filter(Siswa.id == item.siswa_id, Siswa.id_guru == guru.id).first()
        if not siswa:
            continue
            
        if siswa.sisa_pertemuan <= 0:
            continue # Skip exhausted sessions
            
        status_enum = status_map.get(item.status.lower(), StatusAbsensi.HADIR)
        
        # log attendance
        log = AbsensiLog(
            uid=siswa.uid,
            waktu=now,
            mode=ModeAbsensi.ONLINE,
            status=status_enum
        )
        db.add(log)
        
        # decrement session if they attended or absent
        if status_enum in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
             siswa.sisa_pertemuan -= 1
             
        saved_count += 1
        
    db.commit()
    
    return {
        "status": "success",
        "message": f"Berhasil menyimpan absensi untuk {saved_count} siswa"
    }
