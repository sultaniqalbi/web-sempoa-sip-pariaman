from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from pydantic import BaseModel

WIB = timezone(timedelta(hours=7))

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

    # 1. Prioritaskan pencocokan nama user dengan nama guru (paling akurat untuk relasi id_guru)
    if current_user.nama and current_user.nama.strip():
        c_nama = current_user.nama.strip()
        guru = db.query(Guru).filter(
            Guru.is_deleted == False,
            or_(
                Guru.nama.ilike(c_nama),
                Guru.nama_panggilan.ilike(c_nama),
                Guru.nama.ilike(f"%{c_nama}%")
            )
        ).first()

    # 2. Cari berdasarkan uid_terhubung jika belum cocok nama
    if not guru and current_user.uid_terhubung:
        try:
            int_id = int(current_user.uid_terhubung)
            guru = db.query(Guru).filter(
                (Guru.id == int_id) | (Guru.uid == str(current_user.uid_terhubung)),
                Guru.is_deleted == False
            ).first()
        except (ValueError, TypeError):
            guru = db.query(Guru).filter(Guru.uid == str(current_user.uid_terhubung), Guru.is_deleted == False).first()

    # 3. Cari berdasarkan prefix email
    if not guru and current_user.email:
        email_prefix = current_user.email.split("@")[0].lower()
        guru = db.query(Guru).filter(
            Guru.is_deleted == False,
            (
                (Guru.nama.ilike(f"%{email_prefix}%")) |
                (Guru.nama_panggilan.ilike(f"%{email_prefix}%"))
            )
        ).first()

    # 4. Fallback ke guru aktif manapun yang ada
    if not guru:
        guru = db.query(Guru).filter(Guru.is_deleted == False).first()

    # 5. Jika belum ada sama sekali di tabel guru, buat profil baru
    if not guru:
        guru_name = current_user.nama or "Guru Pengajar"
        guru = Guru(
            uid=current_user.uid_terhubung or f"GURU{current_user.id:03d}",
            nama=guru_name,
            nama_panggilan=guru_name.split()[0] if guru_name else "Guru",
            kategori_program="Sempoa SIP",
            hari_wajib="Senin, Selasa, Rabu, Kamis, Jumat",
            target_kehadiran=12,
            mode_kelas="OFFLINE"
        )
        db.add(guru)
        db.commit()
        db.refresh(guru)

    # Selalu sinkronkan uid_terhubung pada akun user
    if current_user.uid_terhubung != str(guru.id):
        current_user.uid_terhubung = str(guru.id)
        db.commit()

    return guru

def _get_guru_programs(guru: Guru) -> List[str]:
    if not guru or not guru.kategori_program:
        return ["sempoa sip"]
    return [p.strip().lower() for p in guru.kategori_program.split(",") if p.strip()]

def _get_matching_guru_ids(db: Session, guru: Guru) -> List[int]:
    """Cari semua ID guru yang cocok dengan guru ini (menangani duplikat nama dll)."""
    ids = set()
    ids.add(guru.id)
    if guru.nama:
        nama = guru.nama.strip()
        rows = db.query(Guru.id).filter(
            Guru.is_deleted == False,
            or_(
                Guru.nama.ilike(nama),
                Guru.nama_panggilan.ilike(nama),
                Guru.nama.ilike(f"%{nama}%")
            )
        ).all()
        for r in rows:
            ids.add(r[0])
    return list(ids)

def _get_guru_students(db: Session, guru: Guru, matching_guru_ids: List[int], filter_program: str = None):
    """
    Ambil daftar siswa bimbingan guru secara PASTI.
    Logika:
    1. Jika guru adalah supervisor (Kepala Sekolah/Direktur/Admin/Owner), ambil SEMUA siswa.
    2. Jika ada siswa yang id_guru-nya cocok, ambil siswa-siswa itu + siswa tanpa guru yang programnya cocok.
    3. Jika tidak ada siswa dengan id_guru cocok, ambil siswa berdasarkan kecocokan program.
    """
    is_supervisor = any(k in (guru.kategori_program or "").lower() for k in ["kepala sekolah", "kepsek", "direktur", "admin", "owner"])
    programs = [p.strip().lower() for p in (guru.kategori_program or "Sempoa SIP").split(",") if p.strip()]

    if is_supervisor:
        q = db.query(Siswa).filter(Siswa.is_deleted == False)
    else:
        # Cek berapa siswa yang id_guru-nya cocok
        assigned = db.query(Siswa).filter(
            Siswa.id_guru.in_(matching_guru_ids),
            Siswa.is_deleted == False
        ).count()

        prog_conds = [Siswa.kategori_program.ilike(f"%{p}%") for p in programs]

        if assigned > 0:
            # Ada siswa yang ditugaskan ke guru ini — ambil mereka + siswa tanpa guru yang programnya cocok
            q = db.query(Siswa).filter(
                Siswa.is_deleted == False,
                or_(
                    Siswa.id_guru.in_(matching_guru_ids),
                    and_(Siswa.id_guru == None, or_(*prog_conds)) if prog_conds else Siswa.id_guru.in_(matching_guru_ids)
                )
            )
        else:
            # Tidak ada siswa yang ditugaskan — fallback ke program saja
            q = db.query(Siswa).filter(
                Siswa.is_deleted == False,
                or_(*prog_conds) if prog_conds else Siswa.id_guru.in_(matching_guru_ids)
            )

    if filter_program and filter_program.lower() != 'all':
        q = q.filter(Siswa.kategori_program.ilike(f"%{filter_program}%"))

    return q.order_by(Siswa.nama).all()

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_guru_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = _get_current_guru(db, current_user)
    matching_ids = _get_matching_guru_ids(db, guru)
    active_students = _get_guru_students(db, guru, matching_ids)
    programs = _get_guru_programs(guru)

    total_siswa = len(active_students)
    today = datetime.now(WIB).date()

    # Find teacher's latest attendance tap
    last_tap = None
    if guru.uid:
        last_tap = db.query(AbsensiLog).filter(
            AbsensiLog.uid == guru.uid,
            func.date(AbsensiLog.waktu) == today
        ).order_by(AbsensiLog.waktu.desc()).first()

    status_val = "Belum Absen"
    if last_tap:
        status_val = last_tap.status.value if hasattr(last_tap.status, 'value') else str(last_tap.status)

    if last_tap and last_tap.waktu:
        lt_wib = last_tap.waktu.astimezone(WIB) if last_tap.waktu.tzinfo else last_tap.waktu.replace(tzinfo=WIB)
        tanggal_str = lt_wib.strftime("%d/%m/%Y")
        jam_str = lt_wib.strftime("%H:%M:%S WIB")
    else:
        tanggal_str = today.strftime("%d/%m/%Y")
        jam_str = "-"

    absensi_guru = {
        "status": status_val,
        "tanggal": tanggal_str,
        "jam": jam_str
    }

    # Jadwal hari ini
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    hari_ini = days[today.weekday()]
    is_active_today = hari_ini in (guru.hari_wajib or "Senin, Selasa, Rabu, Kamis, Jumat, Sabtu")

    jadwal_conds = [Jadwal.id_guru.in_(matching_ids)]
    for p in programs:
        jadwal_conds.append(Jadwal.kategori_program.ilike(f"%{p}%"))
    for gid in matching_ids:
        jadwal_conds.append(Jadwal.guru_ids.ilike(f"%{gid}%"))

    jadwal_row = db.query(Jadwal).filter(or_(*jadwal_conds)).first()

    jam_mulai_str = str(jadwal_row.jam_mulai) if jadwal_row and jadwal_row.jam_mulai else "08:30"
    jam_selesai_str = str(jadwal_row.jam_selesai) if jadwal_row and jadwal_row.jam_selesai else "11:30"
    ruangan_str = str(jadwal_row.lokasi) if jadwal_row and jadwal_row.lokasi else f"TC Pariaman - Ruang {guru.kategori_program or 'Sempoa'}"

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
    uids_program = [s.uid for s in active_students if s.uid]
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

    # Latest learning note
    note_conds = [CatatanPembelajaran.id_guru.in_(matching_ids)]
    for p in programs:
        note_conds.append(CatatanPembelajaran.kategori_program.ilike(f"%{p}%"))

    latest_note = db.query(CatatanPembelajaran).filter(or_(*note_conds)).order_by(CatatanPembelajaran.created_at.desc()).first()

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
            "uid_rfid": guru.uid or "",
            "program": guru.kategori_program or "Sempoa SIP",
            "foto_profil": guru.foto_profil,
            "no_wa": guru.whatsapp_guru or "",
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

def _format_days_range_py(days_str: Optional[str]) -> str:
    if not days_str:
        return "Senin - Sabtu"
    days = [d.strip() for d in days_str.split(",") if d.strip()]
    if not days:
        return "Senin - Sabtu"
    all_mon_sat = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    all_mon_fri = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
    if len(days) == 6 and all(d in days for d in all_mon_sat):
        return "Senin - Sabtu"
    if len(days) == 5 and all(d in days for d in all_mon_fri):
        return "Senin - Jumat"
    if len(days) == 2 and days[0] == "Jumat" and days[1] == "Sabtu":
        return "Jumat, Sabtu"
    if len(days) == 2 and days[0] == "Senin" and days[1] == "Rabu":
        return "Senin, Rabu"
    return ", ".join(days)

@router.get("/kelas-bimbingan")
async def get_kelas_bimbingan(
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = _get_current_guru(db, current_user)
    raw_programs = [p.strip() for p in (guru.kategori_program or "Sempoa SIP").split(",") if p.strip()]
    
    # Default schedule & room configs
    default_schedules = {
        "Sempoa SIP": {"waktu": "09:00 - 17:00 WIB", "ruangan": "TC Pariaman - Ruang Sempoa"},
        "Fonem": {"waktu": "09:00 - 17:00 WIB", "ruangan": "TC Pariaman - Ruang Fonem"},
        "Tahfidz": {"waktu": "12:00 - 17:00 WIB", "ruangan": "TC Pariaman - Ruang Tahfidz"},
        "Bahasa Inggris": {"waktu": "12:00 - 17:00 WIB", "ruangan": "TC Pariaman - Ruang Bahasa Inggris"},
        "TK": {"waktu": "08:00 - 11:00 WIB", "ruangan": "TC Pariaman - Ruang TK"}
    }

    kelas_list = []
    for prog in raw_programs:
        # Query active Jadwal record from DB for this program & teacher
        jadwal = db.query(Jadwal).filter(
            or_(
                Jadwal.id_guru == guru.id,
                Jadwal.guru_ids.like(f"%{guru.id}%"),
                func.lower(Jadwal.kategori_program).like(f"%{prog.lower()}%")
            )
        ).first()

        def_cfg = default_schedules.get(prog, {"waktu": "09:00 - 17:00 WIB", "ruangan": f"TC Pariaman - Ruang {prog}"})

        if jadwal:
            ruangan = jadwal.lokasi or def_cfg["ruangan"]
            waktu = f"{jadwal.jam_mulai} - {jadwal.jam_selesai} WIB" if jadwal.jam_mulai and jadwal.jam_selesai else def_cfg["waktu"]
            hari = _format_days_range_py(jadwal.hari) if jadwal.hari else _format_days_range_py(guru.hari_wajib)
            mode_kelas = jadwal.mode_kelas or guru.mode_kelas or "OFFLINE"
        else:
            ruangan = def_cfg["ruangan"]
            waktu = def_cfg["waktu"]
            hari = _format_days_range_py(guru.hari_wajib)
            mode_kelas = guru.mode_kelas or "OFFLINE"

        # Count active students for this specific program
        prog_siswa_count = db.query(Siswa).filter(
            func.lower(Siswa.kategori_program).like(f"%{prog.lower()}%"),
            Siswa.status_spp == StatusSPP.AKTIF,
            Siswa.is_deleted == False
        ).count()

        kelas_list.append({
            "kode_program": prog.upper().replace(" ", "_"),
            "nama_program": prog,
            "waktu": waktu,
            "ruangan": ruangan,
            "hari": hari,
            "jumlah_siswa": prog_siswa_count,
            "paket": guru.paket_pengajaran or "Reguler",
            "mode_kelas": mode_kelas
        })

    return {"kelas": kelas_list}

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
    available_programs = [p.strip() for p in (guru.kategori_program or "Sempoa SIP").split(",") if p.strip()]
    current_active_prog = program if (program and program.lower() != 'all') else (available_programs[0] if available_programs else None)

    matching_ids = _get_matching_guru_ids(db, guru)
    students = _get_guru_students(db, guru, matching_ids, filter_program=program)

    if tanggal:
        try:
            target_date = datetime.strptime(tanggal, "%Y-%m-%d").date()
        except ValueError:
            target_date = datetime.now().date()
    else:
        target_date = datetime.now().date()
        
    now_str = target_date.strftime("%d %b %Y")
    
    # Query today's logs for these students strictly for this program
    uids = [s.uid for s in students]
    logs_map = {}
    if uids:
        log_query = db.query(AbsensiLog).filter(
            AbsensiLog.uid.in_(uids),
            func.date(AbsensiLog.waktu) == target_date
        )
        if current_active_prog:
            log_query = log_query.filter(
                or_(
                    func.lower(AbsensiLog.kategori_program) == current_active_prog.lower(),
                    func.lower(AbsensiLog.kategori_program).like(f"%{current_active_prog.lower()}%"),
                    AbsensiLog.kategori_program == None
                )
            )
        today_logs = log_query.order_by(AbsensiLog.waktu.desc()).all()
        for l in today_logs:
            if l.uid not in logs_map:
                s_name = l.status.value if hasattr(l.status, 'value') else str(l.status)
                sesi_val = 1
                if l.catatan:
                    import re
                    match = re.search(r'(\d+)\s*Sesi', l.catatan, re.IGNORECASE)
                    if match:
                        try:
                            sesi_val = int(match.group(1))
                        except Exception:
                            sesi_val = 1
                logs_map[l.uid] = {
                    "status": s_name.lower(),
                    "jam": l.waktu.strftime("%H:%M WIB"),
                    "jumlah_sesi": sesi_val,
                    "catatan": l.catatan
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
            "kategori_program": s.kategori_program,
            "kuota_program": s.kuota_program,
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
            "jam_tap_hari_ini": today_log["jam"] if today_log else None,
            "jumlah_sesi_hari_ini": today_log["jumlah_sesi"] if today_log else 1
        })
        
    return {
        "tanggal_hari_ini": target_date.strftime("%A, %d %B %Y"),
        "siswa": result,
        "available_programs": available_programs,
        "selected_program": current_active_prog
    }

class SiswaAbsensiItem(BaseModel):
    siswa_id: int
    status: str
    jumlah_sesi: Optional[int] = 1

class SiswaAbsensiSubmit(BaseModel):
    siswa_absensi: List[SiswaAbsensiItem]
    catatan_pembelajaran: Optional[str] = None
    tanggal: Optional[str] = None
    jam: Optional[str] = None
    program: Optional[str] = None

def _update_student_program_quota(siswa: Siswa, program_name: Optional[str], delta: int):
    import json
    progs = [p.strip() for p in (siswa.kategori_program or "Sempoa SIP").split(",") if p.strip()]
    if not progs:
        progs = ["Sempoa SIP"]

    kuota_dict = {}
    if siswa.kuota_program:
        try:
            parsed = json.loads(siswa.kuota_program)
            if isinstance(parsed, dict) and parsed:
                kuota_dict = parsed
        except Exception:
            kuota_dict = {}

    for p in progs:
        if p not in kuota_dict:
            target = 8
            if p == "Sempoa SIP":
                target = 12 if "12" in (siswa.paket_jadwal or "") else 8
            elif p in ["Fonem", "Tahfidz"]:
                target = 12
            elif p == "Bahasa Inggris":
                target = 8
            elif p == "TK":
                target = 0
            kuota_dict[p] = {"sisa": target, "target": target}

    target_p = None
    if program_name and program_name != "all":
        for p in progs:
            if program_name.lower() in p.lower() or p.lower() in program_name.lower():
                target_p = p
                break
    
    if not target_p:
        target_p = progs[0]

    if target_p and target_p in kuota_dict and target_p.lower() != "tk":
        q = kuota_dict[target_p]
        target_val = q.get("target", 8)
        current_sisa = q.get("sisa", target_val)
        new_sisa = max(0, min(target_val, current_sisa + delta))
        kuota_dict[target_p]["sisa"] = new_sisa

    siswa.kuota_program = json.dumps(kuota_dict)
    siswa.sisa_pertemuan = sum(v.get("sisa", 0) for k, v in kuota_dict.items() if k.lower() != "tk")

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
            if data.jam:
                from datetime import time
                hour, minute = map(int, data.jam.split(':'))
                now = datetime.combine(target_date, time(hour=hour, minute=minute))
            else:
                now = datetime.combine(target_date, datetime.now().time())
        except Exception:
            pass

    saved_count = 0
    updated_students_data = []

    programs = _get_guru_programs(guru)
    prog_conditions = [func.lower(Siswa.kategori_program).like(f"%{p}%") for p in programs]

    # Effective program being marked
    active_program = data.program or (programs[0] if len(programs) == 1 else "Sempoa SIP")

    for item in data.siswa_absensi:
        siswa = db.query(Siswa).filter(
            Siswa.id == item.siswa_id,
            func.lower(Siswa.kategori_program).like(f"%{active_program.lower()}%"),
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

        # Check if already marked on this date strictly for this active_program
        existing_log = db.query(AbsensiLog).filter(
            AbsensiLog.uid == siswa.uid,
            func.date(AbsensiLog.waktu) == now.date(),
            or_(
                func.lower(AbsensiLog.kategori_program) == active_program.lower(),
                func.lower(AbsensiLog.kategori_program).like(f"%{active_program.lower()}%"),
                AbsensiLog.kategori_program == None
            )
        ).first()

        sesi_count = max(1, item.jumlah_sesi or 1)
        catatan_text = f"{sesi_count} Sesi Gabungan" if sesi_count > 1 else None

        if existing_log:
            prev_status = existing_log.status
            prev_sesi = 1
            if existing_log.catatan:
                import re
                match = re.search(r'(\d+)\s*Sesi', existing_log.catatan, re.IGNORECASE)
                if match:
                    try:
                        prev_sesi = int(match.group(1))
                    except Exception:
                        prev_sesi = 1

            existing_log.status = status_enum
            existing_log.waktu = now
            existing_log.mode = mode_enum
            existing_log.kategori_program = active_program
            existing_log.catatan = catatan_text

            # If changed from IZIN to HADIR or ALFA: deduct remaining sessions by sesi_count
            if prev_status == StatusAbsensi.IZIN and status_enum in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                _update_student_program_quota(siswa, active_program, -sesi_count)
            # If changed from HADIR or ALFA to IZIN: restore prev_sesi sessions
            elif prev_status in [StatusAbsensi.HADIR, StatusAbsensi.ALFA] and status_enum == StatusAbsensi.IZIN:
                _update_student_program_quota(siswa, active_program, +prev_sesi)
            # If still in HADIR or ALFA, but session count changed
            elif prev_status in [StatusAbsensi.HADIR, StatusAbsensi.ALFA] and status_enum in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                sesi_diff = sesi_count - prev_sesi
                if sesi_diff != 0:
                    _update_student_program_quota(siswa, active_program, -sesi_diff)
        else:
            # Student has no sessions left and no log exists today: skip unless marked IZIN or is TK
            is_tk = "tk" in (active_program or "").lower()
            if siswa.sisa_pertemuan <= 0 and not is_tk and status_enum in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                continue

            log = AbsensiLog(
                uid=siswa.uid,
                kategori_program=active_program,
                waktu=now,
                mode=mode_enum,
                status=status_enum,
                catatan=catatan_text,
                sumber="PORTAL_GURU"
            )
            db.add(log)
            if status_enum in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                _update_student_program_quota(siswa, active_program, -sesi_count)

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
            kategori_program=active_program,
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
        "program": active_program,
        "tanggal": now.strftime("%Y-%m-%d"),
        "tanggal_formatted": now.strftime("%A, %d %B %Y"),
        "catatan": catatan_saved,
        "updated_students": updated_students_data
    })

    if catatan_saved:
        manager.broadcast_sync("CATATAN_UPDATE", {
            "guru_id": guru.id,
            "guru_nama": guru.nama,
            "program": active_program,
            "tanggal": now.strftime("%d %B %Y"),
            "catatan": catatan_saved,
            "waktu": now.strftime("%H:%M WIB")
        })

    return {
        "status": "success",
        "message": f"Berhasil menyimpan absensi program {active_program} untuk {saved_count} siswa"
    }

@router.get("/rekap-absensi")
async def get_rekap_absensi(
    tanggal: str = Query(..., description="Format YYYY-MM-DD"),
    program: Optional[str] = Query(None, description="Filter program spesifik"),
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_only)
):
    guru = _get_current_guru(db, current_user)
    available_programs = [p.strip() for p in (guru.kategori_program or "Sempoa SIP").split(",") if p.strip()]

    try:
        filter_date = datetime.strptime(tanggal, "%Y-%m-%d").date()
    except ValueError:
        filter_date = datetime.now().date()

    # Determine effective program strictly from teacher's authorized programs
    if program and program.lower() != 'all':
        matching_p = [p for p in available_programs if program.lower() in p.lower() or p.lower() in program.lower()]
        current_rekap_prog = matching_p[0] if matching_p else available_programs[0]
    else:
        current_rekap_prog = available_programs[0] if available_programs else "Sempoa SIP"

    matching_ids = _get_matching_guru_ids(db, guru)
    students = _get_guru_students(db, guru, matching_ids, filter_program=current_rekap_prog)

    uids = [s.uid for s in students]
    logs_map = {}
    if uids:
        log_query = db.query(AbsensiLog).filter(
            AbsensiLog.uid.in_(uids),
            func.date(AbsensiLog.waktu) == filter_date
        )
        if current_rekap_prog:
            log_query = log_query.filter(
                or_(
                    func.lower(AbsensiLog.kategori_program) == current_rekap_prog.lower(),
                    func.lower(AbsensiLog.kategori_program).like(f"%{current_rekap_prog.lower()}%"),
                    AbsensiLog.kategori_program == None
                )
            )
        date_logs = log_query.order_by(AbsensiLog.waktu.desc()).all()
        for l in date_logs:
            if l.uid not in logs_map:
                s_name = l.status.value if hasattr(l.status, 'value') else str(l.status)
                if l.catatan and "Sesi" in l.catatan:
                    s_name = f"{s_name} ({l.catatan})"
                logs_map[l.uid] = {
                    "status": s_name,
                    "jam": l.waktu.strftime("%H:%M WIB")
                }

    # Fetch notes on that date
    note_row = db.query(CatatanPembelajaran).filter(
        or_(
            CatatanPembelajaran.id_guru == guru.id,
            func.lower(CatatanPembelajaran.kategori_program).like(f"%{current_rekap_prog.lower()}%")
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
        "available_programs": available_programs,
        "selected_program": program or "all",
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
        "waktu": target_datetime.strftime("%H:%M:%S WIB"),
        "tanggal": target_datetime.strftime("%d/%m/%Y")
    })

    return {
        "status": "success",
        "message": f"Kehadiran guru {guru.nama} berhasil dicatat pada {target_datetime.strftime('%d/%m/%Y %H:%M:%S WIB')} (Manual Web)",
        "waktu_tercatat": target_datetime.isoformat()
    }

class IzinGuruRequest(BaseModel):
    alasan: str
    tipe_izin: str  # "HARIAN" atau "JADWAL"
    tanggal_mulai: str  # Format: YYYY-MM-DD
    tanggal_selesai: Optional[str] = None  # Format: YYYY-MM-DD (untuk tipe HARIAN)
    jam_mulai: Optional[str] = None  # Format: HH:MM (untuk tipe JADWAL)
    jam_selesai: Optional[str] = None  # Format: HH:MM (untuk tipe JADWAL)
    jenis_izin: Optional[str] = "Izin"

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

    jenis_kategori = payload.jenis_izin.strip() if payload.jenis_izin and payload.jenis_izin.strip() else ("Izin Harian" if tipe == "HARIAN" else "Izin Jadwal")

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

            note_text = f"[{jenis_kategori}] {payload.alasan.strip()}"
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
        note_text = f"[{jenis_kategori} {jam_mulai_str}-{jam_selesai_str} WIB] {payload.alasan.strip()}"

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

@router.put("/izin-guru/{id}")
async def update_guru_izin_portal(
    id: int,
    payload: IzinGuruRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    guru = db.query(Guru).filter(Guru.id_user == current_user.id).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Profil guru tidak ditemukan.")

    log = db.query(AbsensiLog).filter(AbsensiLog.id == id, AbsensiLog.uid == guru.uid).first()
    if not log:
        raise HTTPException(status_code=404, detail="Data izin tidak ditemukan.")

    if not payload.alasan.strip():
        raise HTTPException(status_code=400, detail="Alasan izin wajib diisi.")

    tipe = payload.tipe_izin.upper()
    try:
        target_date = datetime.strptime(payload.tanggal_mulai, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Format tanggal tidak valid.")

    jenis_kategori = payload.jenis_izin.strip() if payload.jenis_izin and payload.jenis_izin.strip() else ("Izin Harian" if tipe == "HARIAN" else "Izin Jadwal")

    if tipe == "JADWAL":
        jam_mulai_str = payload.jam_mulai or "08:00"
        jam_selesai_str = payload.jam_selesai or "10:00"
        try:
            h, m = [int(x) for x in jam_mulai_str.split(":")]
        except Exception:
            h, m = 8, 0
        waktu_target = datetime(target_date.year, target_date.month, target_date.day, h, m).replace(tzinfo=WIB)
        note_text = f"[{jenis_kategori} {jam_mulai_str}-{jam_selesai_str} WIB] {payload.alasan.strip()}"
        log.sumber = "IZIN_JADWAL"
    else:
        waktu_target = datetime(target_date.year, target_date.month, target_date.day, 8, 0).replace(tzinfo=WIB)
        note_text = f"[{jenis_kategori}] {payload.alasan.strip()}"
        log.sumber = "IZIN_HARIAN"

    log.waktu = waktu_target
    log.status = StatusAbsensi.IZIN
    log.catatan = note_text

    db.commit()

    manager.broadcast_sync("ABSENSI_GURU_UPDATE", {
        "guru_id": guru.id,
        "guru_nama": guru.nama,
        "uid": guru.uid,
        "status": "IZIN",
        "sumber": log.sumber,
        "alasan": payload.alasan,
        "keterangan": f"Tanggal {target_date.strftime('%d/%m/%Y')}"
    })

    return {
        "status": "success",
        "message": f"Izin guru {guru.nama} berhasil diperbarui!"
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
    if image.format not in ("JPEG", "JPG", "PNG", "MPO"):
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Harap gunakan format JPG atau PNG.")

    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    max_size = (800, 800)
    image.thumbnail(max_size, Image.Resampling.LANCZOS)

    filename = f"guru_{guru.uid}_{uuid.uuid4().hex[:8]}.jpg"
    upload_dir = os.path.join(os.path.dirname(__file__), "../../../uploads/profil")
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, filename)
    image.save(filepath, "JPEG", quality=85)

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

