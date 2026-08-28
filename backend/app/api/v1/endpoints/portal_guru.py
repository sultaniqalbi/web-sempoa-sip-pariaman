from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.websocket import manager
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.siswa import Siswa, StatusSPP
from app.models.absensi_log import AbsensiLog, StatusAbsensi, ModeAbsensi
from app.models.jadwal import Jadwal
from app.models.catatan_pembelajaran import CatatanPembelajaran
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran

router = APIRouter()
teacher_only = RoleChecker([UserRole.guru])

def _get_current_guru(db: Session, current_user: User) -> Guru:
    guru = None
    if current_user.uid_terhubung:
        try:
            int_id = int(current_user.uid_terhubung)
            guru = db.query(Guru).filter((Guru.id == int_id) | (Guru.uid == str(current_user.uid_terhubung))).first()
        except (ValueError, TypeError):
            guru = db.query(Guru).filter(Guru.uid == str(current_user.uid_terhubung)).first()

    if not guru and current_user.nama:
        guru = db.query(Guru).filter(func.lower(Guru.nama) == current_user.nama.lower()).first()

    if not guru:
        guru = db.query(Guru).first()

    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")
    return guru

def _get_guru_programs(guru: Guru) -> List[str]:
    if not guru or not guru.kategori_program:
        return ["sempoa sip"]
    return [p.strip().lower() for p in guru.kategori_program.split(",") if p.strip()]

@router.get("/dashboard")
async def get_guru_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = _get_current_guru(db, current_user)
    programs = _get_guru_programs(guru)

    # Get active students for this teacher or matching teacher's program
    active_students = db.query(Siswa).filter(
        or_(
            Siswa.id_guru == guru.id,
            func.lower(Siswa.kategori_program).in_(programs)
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
            Jadwal.guru_ids.like(f"%{guru.id}%"),
            func.lower(Jadwal.kategori_program).in_(programs)
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
            func.lower(CatatanPembelajaran.kategori_program).in_(programs)
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
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    guru = _get_current_guru(db, current_user)

    mode = payload.mode_kelas.upper()
    if mode not in ["ONLINE", "OFFLINE"]:
        mode = "OFFLINE"

    guru.mode_kelas = mode
    db.commit()
    db.refresh(guru)

    manager.broadcast_sync("MODE_KELAS_UPDATE", {
        "guru_id": guru.id,
        "guru_nama": guru.nama,
        "program": guru.kategori_program or "Sempoa SIP",
        "mode_kelas": guru.mode_kelas
    })

    return {"status": "success", "mode_kelas": guru.mode_kelas}

@router.get("/kelas-bimbingan")
async def get_kelas_bimbingan(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = _get_current_guru(db, current_user)
    programs = _get_guru_programs(guru)
        
    total_siswa = db.query(Siswa).filter(
        or_(
            Siswa.id_guru == guru.id,
            func.lower(Siswa.kategori_program).in_(programs)
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
    guru = _get_current_guru(db, current_user)

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
            "status": "Izin" if "izin" in status_name.lower() else ("Hadir" if "hadir" in status_name.lower() else status_name),
            "sumber": getattr(log, 'sumber', 'RFID') or 'RFID',
            "catatan": getattr(log, 'catatan', None)
        })
        
    return {"logs": result}

@router.get("/siswa-absensi")
async def get_siswa_absensi(
    tanggal: Optional[str] = Query(None, description="Format YYYY-MM-DD"),
    program: Optional[str] = Query(None, description="Filter program spesifik (Sempoa SIP, Fonem, dll)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = _get_current_guru(db, current_user)
    raw_programs = _get_guru_programs(guru)
    # Filter programs that have attendance (exclude TK)
    available_programs = [p for p in raw_programs if p.lower() != 'tk']
    if not available_programs and raw_programs:
        available_programs = raw_programs

    # Determine filter
    if program and program.lower() != 'all':
        filter_programs = [program.lower()]
    elif available_programs:
        filter_programs = [p.lower() for p in available_programs]
    else:
        filter_programs = [p.lower() for p in raw_programs]

    students = db.query(Siswa).filter(
        or_(
            Siswa.id_guru == guru.id,
            func.lower(Siswa.kategori_program).in_(filter_programs)
        ),
        func.lower(Siswa.kategori_program) != 'tk',  # Exclude TK from student attendance per specs
        Siswa.is_deleted == False
    ).order_by(Siswa.nama).all()

    if tanggal:
        try:
            target_date = datetime.strptime(tanggal, "%Y-%m-%d").date()
        except ValueError:
            target_date = datetime.now().date()
    else:
        target_date = datetime.now().date()
        
    now_str = target_date.strftime("%d %b %Y")
    
    # Query today's logs for these students
    uids = [s.uid for s in students]
    logs_map = {}
    if uids:
        today_logs = db.query(AbsensiLog).filter(
            AbsensiLog.uid.in_(uids),
            func.date(AbsensiLog.waktu) == target_date
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
        
        # Cek siklus 30 hari
        last_lunas = db.query(PembayaranPeriode).filter(
            PembayaranPeriode.id_siswa == s.id,
            PembayaranPeriode.status == StatusPembayaran.LUNAS
        ).order_by(PembayaranPeriode.created_at.desc()).first()

        if last_lunas and last_lunas.due_date:
            due_date = last_lunas.due_date
        elif last_lunas and last_lunas.created_at:
            due_date = last_lunas.created_at.date() + timedelta(days=30)
        elif s.created_at:
            due_date = s.created_at.date() + timedelta(days=30)
        else:
            due_date = target_date + timedelta(days=30)

        is_expired = target_date > due_date
        is_hangus = is_expired and s.sisa_pertemuan > 0
        is_disabled = s.sisa_pertemuan <= 0 or is_expired
        
        # Jika expired, tampilkan pertemuan selesai penuh
        pertemuan_selesai = s.target_pertemuan if is_expired else (s.target_pertemuan - s.sisa_pertemuan)
        today_log = logs_map.get(s.uid)
        
        status_keterangan = "Normal"
        if is_hangus:
            status_keterangan = "Lewat 30 Hari (Sisa Pertemuan Hangus)"
        elif is_expired:
            status_keterangan = "Masa Aktif 30 Hari Habis (SPP Expired)"
        elif s.sisa_pertemuan <= 0:
            status_keterangan = "Kuota Pertemuan Habis"

        result.append({
            "no": i,
            "id": s.id,
            "uid": s.uid,
            "nama_lengkap": s.nama,
            "panggilan": panggilan,
            "pertemuan_selesai": pertemuan_selesai,
            "total_pertemuan": s.target_pertemuan,
            "sisa_pertemuan": s.sisa_pertemuan,
            "is_disabled": is_disabled,
            "is_expired": is_expired,
            "is_hangus": is_hangus,
            "status_keterangan": status_keterangan,
            "due_date": str(due_date),
            "foto_profil": s.foto_profil,
            "kelas_sekolah": s.kelas_sekolah,
            "asal_sekolah": s.asal_sekolah,
            "tanggal_lengkap": now_str,
            "status_hari_ini": today_log["status"] if today_log else None,
            "jam_tap_hari_ini": today_log["jam"] if today_log else None
        })
        
    return {
        "tanggal_hari_ini": target_date.strftime("%A, %d %B %Y"),
        "siswa": result,
        "available_programs": available_programs,
        "selected_program": program or (available_programs[0] if len(available_programs) == 1 else "all")
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
    guru = _get_current_guru(db, current_user)

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
    updated_students_data = []

    programs = _get_guru_programs(guru)

    for item in data.siswa_absensi:
        siswa = db.query(Siswa).filter(
            Siswa.id == item.siswa_id,
            or_(
                Siswa.id_guru == guru.id,
                func.lower(Siswa.kategori_program).in_(programs)
            ),
            Siswa.is_deleted == False
        ).first()
        if not siswa:
            continue

        status_enum = status_map.get(item.status.lower(), StatusAbsensi.HADIR)

        # Get teacher mode
        guru_mode = (guru.mode_kelas or "OFFLINE").upper()
        try:
            mode_enum = ModeAbsensi(guru_mode)
        except ValueError:
            mode_enum = ModeAbsensi.OFFLINE

        # Check if already marked on this date to update rather than duplicate
        existing_log = db.query(AbsensiLog).filter(
            AbsensiLog.uid == siswa.uid,
            func.date(AbsensiLog.waktu) == now.date()
        ).first()

        if existing_log:
            prev_status = existing_log.status
            existing_log.status = status_enum
            existing_log.waktu = now
            existing_log.mode = mode_enum

            # If changed from IZIN to HADIR or ALFA: deduct remaining sessions
            if prev_status == StatusAbsensi.IZIN and status_enum in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                siswa.sisa_pertemuan = max(0, siswa.sisa_pertemuan - 1)
            # If changed from HADIR or ALFA to IZIN: restore 1 session
            elif prev_status in [StatusAbsensi.HADIR, StatusAbsensi.ALFA] and status_enum == StatusAbsensi.IZIN:
                siswa.sisa_pertemuan = min(siswa.target_pertemuan, siswa.sisa_pertemuan + 1)
            # If changed between HADIR <-> ALFA: both count as 1 session used, so sisa_pertemuan remains unchanged!
        else:
            # Student has no sessions left and no log exists today: skip unless marked IZIN
            if siswa.sisa_pertemuan <= 0 and status_enum in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                continue

            log = AbsensiLog(
                uid=siswa.uid,
                waktu=now,
                mode=mode_enum,
                status=status_enum
            )
            db.add(log)
            if status_enum in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                siswa.sisa_pertemuan = max(0, siswa.sisa_pertemuan - 1)

        # Update SPP status based on remaining meetings
        if siswa.sisa_pertemuan == 0 and siswa.status_spp != StatusSPP.EXPIRED:
            siswa.status_spp = StatusSPP.EXPIRED
            current_month = now.strftime("%Y-%m")
            due_date = now.date() + timedelta(days=7)
            existing_bill = db.query(PembayaranPeriode).filter(
                PembayaranPeriode.id_siswa == siswa.id,
                PembayaranPeriode.periode_bulan == current_month
            ).first()
            if not existing_bill:
                billing = PembayaranPeriode(
                    id_siswa=siswa.id,
                    periode_bulan=current_month,
                    jumlah=150000.00,
                    status=StatusPembayaran.MENUNGGAK,
                    due_date=due_date
                )
                db.add(billing)
        elif siswa.sisa_pertemuan > 0 and siswa.status_spp == StatusSPP.EXPIRED:
            siswa.status_spp = StatusSPP.AKTIF

        saved_count += 1
        updated_students_data.append({
            "siswa_id": siswa.id,
            "uid": siswa.uid,
            "nama": siswa.nama,
            "status": status_enum.value,
            "sisa_pertemuan": siswa.sisa_pertemuan,
            "target_pertemuan": siswa.target_pertemuan,
            "status_spp": siswa.status_spp.value if hasattr(siswa.status_spp, 'value') else str(siswa.status_spp),
            "waktu": now.strftime("%H:%M WIB"),
            "tanggal": now.strftime("%Y-%m-%d")
        })

    # Save catatan pembelajaran if provided
    catatan_saved = None
    if data.catatan_pembelajaran and data.catatan_pembelajaran.strip():
        catatan_entry = CatatanPembelajaran(
            id_guru=guru.id,
            kategori_program=guru.kategori_program or "Sempoa SIP",
            tanggal=now.date(),
            catatan=data.catatan_pembelajaran.strip()
        )
        db.add(catatan_entry)
        catatan_saved = data.catatan_pembelajaran.strip()

    db.commit()

    # Realtime broadcast to all connected portals (Ortu, Admin, Owner, Guru)
    manager.broadcast_sync("ABSENSI_UPDATE", {
        "timestamp": datetime.now().isoformat(),
        "guru_id": guru.id,
        "guru_nama": guru.nama,
        "program": guru.kategori_program or "Sempoa SIP",
        "tanggal": now.strftime("%Y-%m-%d"),
        "tanggal_formatted": now.strftime("%A, %d %B %Y"),
        "catatan": catatan_saved,
        "updated_students": updated_students_data
    })

    if catatan_saved:
        manager.broadcast_sync("CATATAN_UPDATE", {
            "guru_id": guru.id,
            "guru_nama": guru.nama,
            "program": guru.kategori_program or "Sempoa SIP",
            "tanggal": now.strftime("%d %B %Y"),
            "catatan": catatan_saved,
            "waktu": now.strftime("%H:%M WIB")
        })

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
    guru = _get_current_guru(db, current_user)
    programs = _get_guru_programs(guru)

    try:
        filter_date = datetime.strptime(tanggal, "%Y-%m-%d").date()
    except ValueError:
        filter_date = datetime.now().date()

    students = db.query(Siswa).filter(
        or_(
            Siswa.id_guru == guru.id,
            func.lower(Siswa.kategori_program).in_(programs)
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
            func.lower(CatatanPembelajaran.kategori_program).in_(programs)
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

class KehadiranManualGuruRequest(BaseModel):
    tanggal: str  # Format: YYYY-MM-DD
    waktu: str    # Format: HH:MM

@router.post("/kehadiran-manual")
async def input_kehadiran_manual_guru(
    payload: KehadiranManualGuruRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    """
    Input kehadiran guru secara manual dari Portal Guru Web.
    Nama guru otomatis diambil dari sesi user yang login (tidak bisa diubah manual).
    """
    guru = _get_current_guru(db, current_user)

    try:
        tgl_obj = datetime.strptime(payload.tanggal, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Format tanggal tidak valid. Gunakan YYYY-MM-DD")

    try:
        wkt_parts = [int(p) for p in payload.waktu.split(":")]
        hour, minute = wkt_parts[0], wkt_parts[1]
    except Exception:
        hour, minute = datetime.now().hour, datetime.now().minute

    target_datetime = datetime(tgl_obj.year, tgl_obj.month, tgl_obj.day, hour, minute)

    guru_mode = (guru.mode_kelas or "OFFLINE").upper()
    try:
        mode_enum = ModeAbsensi(guru_mode)
    except ValueError:
        mode_enum = ModeAbsensi.OFFLINE

    # Cek apakah sudah ada log kehadiran guru pada tanggal tersebut
    existing_log = db.query(AbsensiLog).filter(
        AbsensiLog.uid == guru.uid,
        func.date(AbsensiLog.waktu) == tgl_obj
    ).first()

    if existing_log:
        existing_log.waktu = target_datetime
        existing_log.mode = mode_enum
        existing_log.status = StatusAbsensi.HADIR
        existing_log.sumber = "MANUAL"
        existing_log.catatan = f"Kehadiran manual web oleh {guru.nama}"
    else:
        new_log = AbsensiLog(
            uid=guru.uid,
            waktu=target_datetime,
            mode=mode_enum,
            status=StatusAbsensi.HADIR,
            sumber="MANUAL",
            catatan=f"Kehadiran manual web oleh {guru.nama}"
        )
        db.add(new_log)

    db.commit()

    manager.broadcast_sync("ABSENSI_GURU_UPDATE", {
        "guru_id": guru.id,
        "guru_nama": guru.nama,
        "uid": guru.uid,
        "status": "HADIR",
        "sumber": "MANUAL",
        "waktu": target_datetime.strftime("%H:%M WIB"),
        "tanggal": target_datetime.strftime("%d %B %Y")
    })

    return {
        "status": "success",
        "message": f"Kehadiran guru {guru.nama} berhasil dicatat pada {target_datetime.strftime('%d %B %Y %H:%M WIB')} (Manual Web)",
        "waktu_tercatat": target_datetime.isoformat()
    }

class IzinGuruRequest(BaseModel):
    alasan: str
    tipe_izin: str  # "HARIAN" atau "JADWAL"
    tanggal_mulai: str  # Format: YYYY-MM-DD
    tanggal_selesai: Optional[str] = None  # Format: YYYY-MM-DD (untuk tipe HARIAN)
    jam_mulai: Optional[str] = None  # Format: HH:MM (untuk tipe JADWAL)
    jam_selesai: Optional[str] = None  # Format: HH:MM (untuk tipe JADWAL)

@router.post("/izin-guru")
async def input_izin_guru(
    payload: IzinGuruRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    """
    Input permohonan / pencatatan izin guru secara mandiri dari Web.
    Mendukung opsi Harian (24 jam) atau Jadwal (rentang jam tertentu).
    """
    guru = _get_current_guru(db, current_user)

    if not payload.alasan or not payload.alasan.strip():
        raise HTTPException(status_code=400, detail="Alasan izin wajib diisi.")

    tipe = payload.tipe_izin.upper()
    if tipe not in ["HARIAN", "JADWAL"]:
        tipe = "HARIAN"

    guru_mode = (guru.mode_kelas or "OFFLINE").upper()
    try:
        mode_enum = ModeAbsensi(guru_mode)
    except ValueError:
        mode_enum = ModeAbsensi.OFFLINE

    if tipe == "HARIAN":
        try:
            start_date = datetime.strptime(payload.tanggal_mulai, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Format tanggal mulai tidak valid.")

        if payload.tanggal_selesai:
            try:
                end_date = datetime.strptime(payload.tanggal_selesai, "%Y-%m-%d").date()
            except ValueError:
                end_date = start_date
        else:
            end_date = start_date

        if end_date < start_date:
            raise HTTPException(status_code=400, detail="Tanggal selesai tidak boleh sebelum tanggal mulai.")

        # Maksimal 30 hari dalam satu kali input
        delta_days = (end_date - start_date).days
        if delta_days > 30:
            raise HTTPException(status_code=400, detail="Rentang izin maksimal 30 hari.")

        for i in range(delta_days + 1):
            curr_date = start_date + timedelta(days=i)
            target_datetime = datetime(curr_date.year, curr_date.month, curr_date.day, 8, 0)
            
            existing_log = db.query(AbsensiLog).filter(
                AbsensiLog.uid == guru.uid,
                func.date(AbsensiLog.waktu) == curr_date
            ).first()

            note_text = f"[Izin Harian] {payload.alasan.strip()}"
            if existing_log:
                existing_log.status = StatusAbsensi.IZIN
                existing_log.sumber = "IZIN_HARIAN"
                existing_log.catatan = note_text
            else:
                new_log = AbsensiLog(
                    uid=guru.uid,
                    waktu=target_datetime,
                    mode=mode_enum,
                    status=StatusAbsensi.IZIN,
                    sumber="IZIN_HARIAN",
                    catatan=note_text
                )
                db.add(new_log)

        date_msg = f"dari {start_date.strftime('%d %b %Y')} s.d. {end_date.strftime('%d %b %Y')}" if delta_days > 0 else start_date.strftime('%d %b %Y')

    else:
        # Tipe JADWAL (rentang jam tertentu pada hari tertentu)
        try:
            target_date = datetime.strptime(payload.tanggal_mulai, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Format tanggal tidak valid.")

        jam_mulai_str = payload.jam_mulai or "08:00"
        jam_selesai_str = payload.jam_selesai or "10:00"

        try:
            h, m = [int(x) for x in jam_mulai_str.split(":")]
        except Exception:
            h, m = 8, 0

        target_datetime = datetime(target_date.year, target_date.month, target_date.day, h, m)
        note_text = f"[Izin Jadwal {jam_mulai_str}-{jam_selesai_str} WIB] {payload.alasan.strip()}"

        existing_log = db.query(AbsensiLog).filter(
            AbsensiLog.uid == guru.uid,
            func.date(AbsensiLog.waktu) == target_date
        ).first()

        if existing_log:
            existing_log.status = StatusAbsensi.IZIN
            existing_log.sumber = "IZIN_JADWAL"
            existing_log.catatan = note_text
        else:
            new_log = AbsensiLog(
                uid=guru.uid,
                waktu=target_datetime,
                mode=mode_enum,
                status=StatusAbsensi.IZIN,
                sumber="IZIN_JADWAL",
                catatan=note_text
            )
            db.add(new_log)

        date_msg = f"tanggal {target_date.strftime('%d %b %Y')} jam {jam_mulai_str} - {jam_selesai_str} WIB"

    db.commit()

    manager.broadcast_sync("ABSENSI_GURU_UPDATE", {
        "guru_id": guru.id,
        "guru_nama": guru.nama,
        "uid": guru.uid,
        "status": "IZIN",
        "sumber": f"IZIN_{tipe}",
        "alasan": payload.alasan,
        "keterangan": date_msg
    })

    return {
        "status": "success",
        "message": f"Izin guru {guru.nama} ({date_msg}) berhasil dicatat!",
        "tipe": tipe
    }

class GuruProfilUpdate(BaseModel):
    nama: Optional[str] = None
    nama_panggilan: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[str] = None
    asal_sekolah: Optional[str] = None
    whatsapp_guru: Optional[str] = None
    alamat: Optional[str] = None
    bio: Optional[str] = None

@router.get("/profil")
async def get_my_guru_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = _get_current_guru(db, current_user)
    return {
        "id": guru.id,
        "uid": guru.uid,
        "nama": guru.nama,
        "nama_panggilan": guru.nama_panggilan or "",
        "tempat_lahir": guru.tempat_lahir or "",
        "tanggal_lahir": guru.tanggal_lahir.strftime("%Y-%m-%d") if guru.tanggal_lahir else "",
        "umur": guru.umur or 0,
        "asal_sekolah": guru.asal_sekolah or "",
        "kategori_program": guru.kategori_program or "Sempoa SIP",
        "hari_wajib": guru.hari_wajib or "",
        "mode_kelas": guru.mode_kelas or "OFFLINE",
        "target_kehadiran": guru.target_kehadiran or 12,
        "whatsapp_guru": guru.whatsapp_guru or "",
        "alamat": guru.alamat or "",
        "bio": guru.bio or "",
        "foto_profil": guru.foto_profil,
        "email": current_user.email
    }

@router.put("/profil")
async def update_my_guru_profile(
    payload: GuruProfilUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    from app.core.security import normalize_whatsapp_number
    guru = _get_current_guru(db, current_user)

    if payload.nama is not None and payload.nama.strip():
        guru.nama = payload.nama.strip()
        current_user.nama = payload.nama.strip()

    if payload.nama_panggilan is not None:
        guru.nama_panggilan = payload.nama_panggilan.strip()

    if payload.tempat_lahir is not None:
        guru.tempat_lahir = payload.tempat_lahir.strip()

    if payload.tanggal_lahir is not None:
        if payload.tanggal_lahir.strip():
            try:
                tgl = datetime.strptime(payload.tanggal_lahir.strip(), "%Y-%m-%d").date()
                guru.tanggal_lahir = tgl
                today = datetime.now().date()
                age = today.year - tgl.year - ((today.month, today.day) < (tgl.month, tgl.day))
                guru.umur = age
            except ValueError:
                pass
        else:
            guru.tanggal_lahir = None

    if payload.asal_sekolah is not None:
        guru.asal_sekolah = payload.asal_sekolah.strip()

    if payload.whatsapp_guru is not None:
        guru.whatsapp_guru = normalize_whatsapp_number(payload.whatsapp_guru.strip())

    if payload.alamat is not None:
        guru.alamat = payload.alamat.strip()

    if payload.bio is not None:
        guru.bio = payload.bio.strip()

    db.commit()
    db.refresh(guru)

    return {
        "status": "success",
        "message": "Profil guru berhasil diperbarui!",
        "guru": {
            "id": guru.id,
            "uid": guru.uid,
            "nama": guru.nama,
            "nama_panggilan": guru.nama_panggilan,
            "tempat_lahir": guru.tempat_lahir,
            "tanggal_lahir": str(guru.tanggal_lahir) if guru.tanggal_lahir else "",
            "umur": guru.umur,
            "asal_sekolah": guru.asal_sekolah,
            "kategori_program": guru.kategori_program,
            "whatsapp_guru": guru.whatsapp_guru,
            "alamat": guru.alamat,
            "bio": guru.bio,
            "foto_profil": guru.foto_profil
        }
    }

@router.post("/profil/upload-foto")
async def upload_my_guru_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    import io, uuid, os
    from PIL import Image
    guru = _get_current_guru(db, current_user)

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran file foto maksimal 10MB.")

    image = Image.open(io.BytesIO(contents))
    if image.format not in ("JPEG", "JPG", "PNG", "WEBP", "MPO"):
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Harap gunakan format JPG, PNG, atau WebP.")

    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    max_size = (800, 800)
    image.thumbnail(max_size, Image.Resampling.LANCZOS)

    filename = f"guru_{guru.uid}_{uuid.uuid4().hex[:8]}.webp"
    upload_dir = os.path.join(os.path.dirname(__file__), "../../../uploads/profil")
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, filename)
    image.save(filepath, "WEBP", quality=80)

    file_url = f"/uploads/profil/{filename}"

    if guru.foto_profil and guru.foto_profil.startswith("/uploads/profil/"):
        old_filename = os.path.basename(guru.foto_profil)
        old_filepath = os.path.join(upload_dir, old_filename)
        if os.path.exists(old_filepath):
            try:
                os.remove(old_filepath)
            except Exception:
                pass

    guru.foto_profil = file_url
    current_user.foto_profil = file_url

    db.commit()
    db.refresh(guru)

    return {"status": "success", "file_url": file_url, "message": "Foto profil berhasil diperbarui!"}

