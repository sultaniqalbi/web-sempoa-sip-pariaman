import os
from typing import List, Optional
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

WIB = timezone(timedelta(hours=7))

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.websocket import manager
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.siswa import Siswa, StatusSPP
from app.models.absensi_log import AbsensiLog, StatusAbsensi, ModeAbsensi
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.schemas.absensi import AbsensiCreate, AbsensiResponse
from app.crud import absensi as crud_absensi
from pydantic import BaseModel

router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

class GuruManualAbsensiRequest(BaseModel):
    id_guru: int
    tanggal: str
    jam: Optional[str] = "08:00"
    status: StatusAbsensi = StatusAbsensi.HADIR
    mode: Optional[str] = "OFFLINE"
    catatan: Optional[str] = None

class GuruIzinRequest(BaseModel):
    id_guru: int
    tanggal_mulai: str
    tanggal_selesai: str
    jenis_izin: str = "Izin"
    keterangan: Optional[str] = None

class BulkSiswaAbsensiItem(BaseModel):
    id_siswa: int
    status: StatusAbsensi  # HADIR / ALFA / IZIN

class BulkSiswaAbsensiRequest(BaseModel):
    tanggal: str  # YYYY-MM-DD
    absensi: List[BulkSiswaAbsensiItem]

@router.get("/", response_model=List[AbsensiResponse])
@router.get("/logs", response_model=List[AbsensiResponse])
async def read_absensi_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    logs = crud_absensi.get_absensi_list(db, skip=skip, limit=limit)
    gurus = db.query(Guru).filter(Guru.is_deleted == False).all()
    guru_map = {}
    for g in gurus:
        if g.uid:
            guru_map[g.uid.strip().upper()] = g
            guru_map[g.uid.strip().upper().replace(" ", "")] = g

    siswas = db.query(Siswa).filter(Siswa.is_deleted == False).all()
    siswa_map = {}
    for s in siswas:
        if s.uid:
            siswa_map[s.uid.strip().upper()] = s
            siswa_map[s.uid.strip().upper().replace(" ", "")] = s

    result = []
    
    # Auto-reconcile: sinkronkan status log guru yang telat tapi tercatat HADIR menjadi TERLAMBAT untuk halaman aktif
    try:
        unmarked_late_logs = [l for l in logs if l.status == StatusAbsensi.HADIR]
        needs_commit = False
        for ul_log in unmarked_late_logs:
            u_clean = ul_log.uid.strip().upper().replace(" ", "") if ul_log.uid else ""
            matched_g = guru_map.get(u_clean)
            if matched_g:
                nama_lower = matched_g.nama.lower()
                if "direktur" in nama_lower:
                    continue
                w_time = ul_log.waktu.astimezone(WIB) if ul_log.waktu.tzinfo else ul_log.waktu.replace(tzinfo=WIB)
                is_u_late = False
                if "dinda" in nama_lower:
                    if w_time.weekday() == 4:
                        is_u_late = (w_time.hour >= 13)
                    elif w_time.weekday() == 5:
                        is_u_late = (w_time.hour >= 10)
                    else:
                        is_u_late = (w_time.hour >= 8)
                elif "husna" in nama_lower:
                    is_u_late = (w_time.hour >= 8)
                else:
                    jam_ajar_str = getattr(matched_g, "paket_pengajaran", "") or ""
                    jam_masuk_str = getattr(matched_g, "jam_masuk", "07:00") or "07:00"
                    th, tm = 8, 0
                    if jam_ajar_str and ":" in jam_ajar_str:
                        try:
                            th = int(jam_ajar_str.split(":")[0])
                            tm = int(jam_ajar_str.split(":")[1][:2])
                        except Exception:
                            th = 8
                    elif jam_masuk_str and ":" in jam_masuk_str:
                        try:
                            th = int(jam_masuk_str.split(":")[0]) + 1
                        except Exception:
                            th = 8
                    if w_time.hour > th or (w_time.hour == th and w_time.minute > tm):
                        is_u_late = True

                if is_u_late:
                    ul_log.status = StatusAbsensi.TERLAMBAT
                    needs_commit = True
        if needs_commit:
            db.commit()
    except Exception:
        db.rollback()

    # Pre-calculate denda (1000 per TERLAMBAT) for gurus dengan UID ter-normalisasi (tanpa spasi)
    denda_map = {}
    norm_uid_expr = func.replace(func.upper(AbsensiLog.uid), " ", "")
    late_counts = db.query(norm_uid_expr, func.count(AbsensiLog.id)).filter(
        AbsensiLog.status == StatusAbsensi.TERLAMBAT
    ).group_by(norm_uid_expr).all()

    for row in late_counts:
        uid_val, count = row
        if uid_val:
            denda_map[uid_val.strip().upper()] = count * 1000

    for log in logs:
        clean_uid = log.uid.strip().upper() if log.uid else ""
        nospace_uid = clean_uid.replace(" ", "")
        g = guru_map.get(clean_uid) or guru_map.get(nospace_uid)
        s = siswa_map.get(clean_uid) or siswa_map.get(nospace_uid)

        resp = AbsensiResponse.model_validate(log)
        if log.waktu:
            if log.waktu.tzinfo is not None:
                resp.waktu = log.waktu.astimezone(WIB)
            else:
                resp.waktu = log.waktu.replace(tzinfo=WIB)
                
        if log.waktu_keluar:
            if log.waktu_keluar.tzinfo is not None:
                resp.waktu_keluar = log.waktu_keluar.astimezone(WIB)
            else:
                resp.waktu_keluar = log.waktu_keluar.replace(tzinfo=WIB)

        if g:
            norm_g_uid = g.uid.strip().upper().replace(" ", "") if g.uid else ""
            resp.guru_nama = g.nama
            resp.kategori_program = g.kategori_program
            resp.role = "guru"
            resp.denda_terakumulasi = denda_map.get(norm_g_uid) or denda_map.get(nospace_uid) or denda_map.get(clean_uid) or 0
        elif s:
            resp.guru_nama = s.nama
            resp.kategori_program = s.kategori_program
            resp.role = "siswa"
            resp.denda_terakumulasi = 0
        else:
            resp.guru_nama = "Kartu Belum Terdaftar"
            resp.kategori_program = "-"
            resp.role = "unregistered"
            resp.denda_terakumulasi = 0
        result.append(resp)
    return result

@router.get("/izin-guru", response_model=List[AbsensiResponse])
async def read_izin_guru_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    logs = db.query(AbsensiLog).filter(AbsensiLog.status == StatusAbsensi.IZIN).order_by(AbsensiLog.waktu.desc()).offset(skip).limit(limit).all()
    gurus = db.query(Guru).filter(Guru.is_deleted == False).all()
    guru_map = {}
    for g in gurus:
        if g.uid:
            guru_map[g.uid.strip().upper()] = g
            guru_map[g.uid.strip().upper().replace(" ", "")] = g

    result = []
    for log in logs:
        clean_uid = log.uid.strip().upper() if log.uid else ""
        nospace_uid = clean_uid.replace(" ", "")
        g = guru_map.get(clean_uid) or guru_map.get(nospace_uid)

        resp = AbsensiResponse.model_validate(log)
        if log.waktu:
            if log.waktu.tzinfo is not None:
                resp.waktu = log.waktu.astimezone(WIB)
            else:
                resp.waktu = log.waktu.replace(tzinfo=WIB)

        if g:
            resp.guru_nama = g.nama
            resp.kategori_program = g.kategori_program
            resp.role = "guru"
        else:
            resp.guru_nama = "Guru Tidak Diketahui"
            resp.kategori_program = "-"
            resp.role = "guru"
        result.append(resp)

    return result

@router.get("/guru-log")
async def get_laporan_absensi_guru(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Laporan Tap RFID Guru + Auto-Detect Guru Tidak Hadir (Zona WIB)
    """
    gurus = db.query(Guru).filter(Guru.is_deleted == False).all()
    today_wib = datetime.now(WIB)
    today_str = today_wib.strftime("%Y-%m-%d")
    today_day_name = today_wib.strftime("%A") # e.g. 'Monday'

    # Day mapping ID
    day_map = {
        "Monday": "Senin", "Tuesday": "Selasa", "Wednesday": "Rabu",
        "Thursday": "Kamis", "Friday": "Jumat", "Saturday": "Sabtu", "Sunday": "Minggu"
    }
    hari_ini_id = day_map.get(today_day_name, "Senin")

    result = []
    for g in gurus:
        # Check tap log today
        logs_today = (
            db.query(AbsensiLog)
            .filter(AbsensiLog.uid == g.uid)
            .order_by(AbsensiLog.waktu.desc())
            .all()
        )

        is_wajib_today = hari_ini_id.lower() in (g.hari_wajib or "").lower()
        tap_today = []
        for l in logs_today:
            l_waktu_wib = l.waktu.astimezone(WIB) if l.waktu.tzinfo else l.waktu.replace(tzinfo=WIB)
            if l_waktu_wib.strftime("%Y-%m-%d") == today_str:
                tap_today.append((l, l_waktu_wib))

        if tap_today:
            status_guru = tap_today[0][0].status.value if hasattr(tap_today[0][0].status, 'value') else str(tap_today[0][0].status)
            jam_tap = tap_today[0][1].strftime("%H:%M")
        elif is_wajib_today:
            status_guru = "TIDAK_HADIR"
            jam_tap = "-"
        else:
            status_guru = "LIBUR"
            jam_tap = "-"

        result.append({
            "id_guru": g.id,
            "uid": g.uid,
            "nama_guru": g.nama,
            "kategori_program": g.kategori_program,
            "hari_wajib": g.hari_wajib,
            "is_wajib_today": is_wajib_today,
            "status_hari_ini": status_guru,
            "jam_tap_terakhir": jam_tap,
            "total_tap_bulan_ini": len([l for l in logs_today if l.waktu.strftime("%Y-%m") == today_str[:7]])
        })

    return result

@router.get("/guru/{guru_id}", response_model=List[AbsensiResponse])
async def read_absensi_by_guru(
    guru_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    guru = db.query(Guru).filter(Guru.id == guru_id).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")
    if current_user.role in [UserRole.admin, UserRole.owner]:
        pass
    elif current_user.role == UserRole.guru and (current_user.uid_terhubung == guru.uid or current_user.uid_terhubung == str(guru.id)):
        pass
    else:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke log absensi guru ini")
    return crud_absensi.get_absensi_by_guru(db, uid=guru.uid, skip=skip, limit=limit)

@router.get("/siswa/{siswa_id}", response_model=List[AbsensiResponse])
async def read_absensi_by_siswa(
    siswa_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        int_id = int(siswa_id)
        siswa = db.query(Siswa).filter(
            (Siswa.id == int_id) | (Siswa.uid == siswa_id),
            Siswa.is_deleted == False
        ).first()
    except (ValueError, TypeError):
        siswa = db.query(Siswa).filter(Siswa.uid == str(siswa_id), Siswa.is_deleted == False).first()

    if not siswa:
        return []
    if current_user.role in [UserRole.admin, UserRole.owner, UserRole.guru]:
        pass
    elif current_user.role == UserRole.ortu and (current_user.uid_terhubung == siswa.uid or current_user.uid_terhubung == str(siswa.id)):
        pass
    else:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke log absensi siswa ini")

    logs = crud_absensi.get_absensi_by_siswa(db, uid=siswa.uid, skip=skip, limit=limit)
    from app.models.catatan_pembelajaran import CatatanPembelajaran
    for log in logs:
        cur_catatan = getattr(log, "catatan", "") or ""
        if "catatan guru" not in cur_catatan.lower():
            log_date = log.waktu.date() if hasattr(log.waktu, 'date') else None
            if log_date:
                note_row = db.query(CatatanPembelajaran).filter(
                    CatatanPembelajaran.tanggal == log_date,
                    or_(
                        CatatanPembelajaran.id_guru == siswa.id_guru,
                        CatatanPembelajaran.kategori_program.ilike(f"%{siswa.kategori_program or ''}%")
                    )
                ).order_by(CatatanPembelajaran.id.desc()).first()
                if note_row and note_row.catatan:
                    if cur_catatan:
                        log.catatan = f"{cur_catatan} • Catatan Guru: {note_row.catatan.strip()}"
                    else:
                        log.catatan = f"Catatan Guru: {note_row.catatan.strip()}"
    return logs

@router.post("/bulk-siswa")
async def bulk_absensi_siswa(
    req: BulkSiswaAbsensiRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    processed = 0
    now = datetime.now(WIB)
    if req.tanggal:
        try:
            target_date = datetime.strptime(req.tanggal, "%Y-%m-%d").date()
            now = datetime.combine(target_date, datetime.now(WIB).time()).replace(tzinfo=WIB)
        except Exception:
            pass

    for item in req.absensi:
        siswa = db.query(Siswa).filter(Siswa.id == item.id_siswa, Siswa.is_deleted == False).first()
        if not siswa:
            continue

        existing_log = db.query(AbsensiLog).filter(
            AbsensiLog.uid == siswa.uid,
            func.date(func.timezone('Asia/Jakarta', AbsensiLog.waktu)) == now.astimezone(WIB).date()
        ).order_by(AbsensiLog.waktu.desc()).first()

        if existing_log:
            prev_status = existing_log.status
            existing_log.status = item.status
            existing_log.waktu = now

            if prev_status == StatusAbsensi.IZIN and item.status in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                siswa.sisa_pertemuan = max(0, siswa.sisa_pertemuan - 1)
            elif prev_status in [StatusAbsensi.HADIR, StatusAbsensi.ALFA] and item.status == StatusAbsensi.IZIN:
                siswa.sisa_pertemuan = min(siswa.target_pertemuan, siswa.sisa_pertemuan + 1)
        else:
            absensi_log = AbsensiLog(
                uid=siswa.uid,
                waktu=now,
                status=item.status
            )
            db.add(absensi_log)

            if item.status in [StatusAbsensi.HADIR, StatusAbsensi.ALFA]:
                if item.status == StatusAbsensi.HADIR:
                    initial_bill = db.query(PembayaranPeriode).filter(
                        PembayaranPeriode.id_siswa == siswa.id,
                        PembayaranPeriode.due_date == None
                    ).first()
                    if initial_bill:
                        initial_bill.due_date = now.date() + timedelta(days=30)
                        
                siswa.sisa_pertemuan = max(0, siswa.sisa_pertemuan - 1)

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

        processed += 1

    db.commit()

    manager.broadcast_sync("ABSENSI_UPDATE", {
        "timestamp": datetime.now().isoformat(),
        "source": "bulk_absensi",
        "tanggal": now.strftime("%Y-%m-%d"),
        "processed_count": processed
    })

    return {"status": "success", "processed_count": processed}

@router.post("/", response_model=AbsensiResponse, status_code=status.HTTP_201_CREATED)
async def create_new_absensi_log(
    absensi_in: AbsensiCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    log = crud_absensi.create_absensi(db, absensi=absensi_in)

    siswa = db.query(Siswa).filter(Siswa.uid == absensi_in.uid.upper().strip(), Siswa.is_deleted == False).first()
    if siswa and absensi_in.status == StatusAbsensi.HADIR:
        initial_bill = db.query(PembayaranPeriode).filter(
            PembayaranPeriode.id_siswa == siswa.id,
            PembayaranPeriode.due_date == None
        ).first()
        if initial_bill:
            initial_bill.due_date = date.today() + timedelta(days=30)
            
        siswa.sisa_pertemuan = max(0, siswa.sisa_pertemuan - 1)
        if siswa.sisa_pertemuan == 0:
            siswa.status_spp = StatusSPP.EXPIRED
            current_month = date.today().strftime("%Y-%m")
            billing = PembayaranPeriode(
                id_siswa=siswa.id,
                periode_bulan=current_month,
                jumlah=150000.00,
                status=StatusPembayaran.MENUNGGAK,
                due_date=date.today() + timedelta(days=7)
            )
            db.add(billing)
        db.commit()

    manager.broadcast_sync("ABSENSI_UPDATE", {
        "timestamp": datetime.now().isoformat(),
        "source": "create_absensi",
        "uid": absensi_in.uid,
        "status": absensi_in.status.value if hasattr(absensi_in.status, 'value') else str(absensi_in.status),
        "siswa_id": siswa.id if siswa else None
    })

    return log


class AbsensiUpdate(BaseModel):
    uid: Optional[str] = None
    waktu: Optional[str] = None
    mode: Optional[ModeAbsensi] = None
    status: Optional[StatusAbsensi] = None
    catatan: Optional[str] = None


@router.put("/{id}", response_model=AbsensiResponse)
async def update_absensi_log(
    id: int,
    absensi_in: AbsensiUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    log = db.query(AbsensiLog).filter(AbsensiLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log absensi tidak ditemukan")

    update_dict = absensi_in.model_dump(exclude_unset=True)
    if "waktu" in update_dict and update_dict["waktu"]:
        w_val = update_dict["waktu"]
        if isinstance(w_val, str):
            try:
                if "T" in w_val:
                    w_dt = datetime.fromisoformat(w_val.replace("Z", "+00:00"))
                    if w_dt.tzinfo is None:
                        w_dt = w_dt.replace(tzinfo=WIB)
                else:
                    w_dt = datetime.strptime(w_val.strip(), "%Y-%m-%d %H:%M:%S").replace(tzinfo=WIB)
                update_dict["waktu"] = w_dt
            except Exception:
                pass
        elif isinstance(w_val, datetime) and w_val.tzinfo is None:
            update_dict["waktu"] = w_val.replace(tzinfo=WIB)

    if "uid" in update_dict and update_dict["uid"]:
        update_dict["uid"] = update_dict["uid"].strip().upper()

    for key, value in update_dict.items():
        setattr(log, key, value)

    db.commit()
    db.refresh(log)

    manager.broadcast_sync("ABSENSI_UPDATE", {
        "timestamp": datetime.now(WIB).isoformat(),
        "source": "update_absensi",
        "id": log.id,
        "uid": log.uid,
        "status": log.status.value if hasattr(log.status, 'value') else str(log.status)
    })

    g = db.query(Guru).filter(
        (func.upper(Guru.uid) == log.uid.upper()) |
        (func.replace(func.upper(Guru.uid), " ", "") == log.uid.upper().replace(" ", ""))
    ).first()
    s = db.query(Siswa).filter(
        (func.upper(Siswa.uid) == log.uid.upper()) |
        (func.replace(func.upper(Siswa.uid), " ", "") == log.uid.upper().replace(" ", "")),
        Siswa.is_deleted == False
    ).first()
    resp = AbsensiResponse.model_validate(log)
    if log.waktu:
        if log.waktu.tzinfo is not None:
            resp.waktu = log.waktu.astimezone(WIB)
        else:
            resp.waktu = log.waktu.replace(tzinfo=WIB)

    if g:
        resp.guru_nama = g.nama
        resp.kategori_program = g.kategori_program
        resp.role = "guru"
    elif s:
        resp.guru_nama = s.nama
        resp.kategori_program = s.kategori_program
        resp.role = "siswa"
    else:
        resp.guru_nama = "Kartu Belum Terdaftar"
        resp.kategori_program = "-"
        resp.role = "unregistered"
    return resp


@router.delete("/{id}")
async def delete_absensi_log(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    log = db.query(AbsensiLog).filter(AbsensiLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log absensi tidak ditemukan")

    deleted_id = log.id
    deleted_uid = log.uid
    db.delete(log)
    db.commit()

    manager.broadcast_sync("ABSENSI_UPDATE", {
        "timestamp": datetime.now(WIB).isoformat(),
        "source": "delete_absensi",
        "id": deleted_id,
        "uid": deleted_uid
    })
    return {"status": "success", "message": "Log absensi berhasil dihapus"}


@router.post("/guru-manual")
async def create_guru_manual_absensi(
    req: GuruManualAbsensiRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    guru = db.query(Guru).filter(Guru.id == req.id_guru).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")
    if not guru.uid:
        raise HTTPException(status_code=400, detail="Guru ini belum memiliki UID RFID yang terdaftar")

    try:
        t_date = datetime.strptime(req.tanggal, "%Y-%m-%d").date()
    except Exception:
        t_date = datetime.now(WIB).date()

    try:
        t_time = datetime.strptime(req.jam or "08:00", "%H:%M").time()
    except Exception:
        t_time = datetime.now(WIB).time()

    waktu_target = datetime.combine(t_date, t_time).replace(tzinfo=WIB)

    try:
        mode_val = ModeAbsensi(req.mode.upper() if req.mode else "OFFLINE")
    except Exception:
        mode_val = ModeAbsensi.OFFLINE

    # Cek Keterlambatan Otomatis pada Input Manual
    final_status = req.status
    if req.status in [StatusAbsensi.HADIR, StatusAbsensi.TERLAMBAT]:
        nama_lower = guru.nama.lower()
        is_late = False
        if "direktur" in nama_lower:
            is_late = False
        elif "dinda" in nama_lower:
            if t_date.weekday() == 4:
                is_late = (t_time.hour >= 13)
            elif t_date.weekday() == 5:
                is_late = (t_time.hour >= 10)
            else:
                is_late = (t_time.hour >= 8)
        elif "husna" in nama_lower:
            is_late = (t_time.hour >= 8)
        else:
            jam_ajar_str = getattr(guru, "paket_pengajaran", "") or ""
            jam_masuk_str = getattr(guru, "jam_masuk", "07:00") or "07:00"
            th, tm = 8, 0
            if jam_ajar_str and ":" in jam_ajar_str:
                try:
                    parts = jam_ajar_str.split(":")
                    th = int(parts[0])
                    tm = int(parts[1][:2])
                except Exception:
                    th = 8
            elif jam_masuk_str and ":" in jam_masuk_str:
                try:
                    th = int(jam_masuk_str.split(":")[0]) + 1
                except Exception:
                    th = 8

            if t_time.hour > th or (t_time.hour == th and t_time.minute > tm):
                is_late = True
            elif req.status == StatusAbsensi.TERLAMBAT:
                is_late = True

        final_status = StatusAbsensi.TERLAMBAT if is_late else StatusAbsensi.HADIR

    existing_log = db.query(AbsensiLog).filter(
        AbsensiLog.uid == guru.uid,
        func.date(func.timezone('Asia/Jakarta', AbsensiLog.waktu)) == t_date
    ).first()

    if existing_log:
        existing_log.status = final_status
        existing_log.waktu = waktu_target
        existing_log.mode = mode_val
        existing_log.catatan = req.catatan or "Presensi manual admin"
        existing_log.sumber = "PORTAL_ADMIN"
    else:
        new_log = AbsensiLog(
            uid=guru.uid,
            waktu=waktu_target,
            mode=mode_val,
            status=final_status,
            catatan=req.catatan or "Presensi manual admin",
            sumber="PORTAL_ADMIN"
        )
        db.add(new_log)

    db.commit()
    return {"status": "success", "message": f"Presensi untuk {guru.nama} berhasil dicatat pada {req.tanggal} (Status: {final_status.value})"}


@router.post("/guru-izin")
async def create_guru_izin(
    req: GuruIzinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    guru = db.query(Guru).filter(Guru.id == req.id_guru).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")
    if not guru.uid:
        raise HTTPException(status_code=400, detail="Guru ini belum memiliki UID RFID yang terdaftar")

    try:
        start_date = datetime.strptime(req.tanggal_mulai, "%Y-%m-%d").date()
        end_date = datetime.strptime(req.tanggal_selesai, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Format tanggal tidak valid (YYYY-MM-DD)")

    if end_date < start_date:
        raise HTTPException(status_code=400, detail="Tanggal selesai tidak boleh sebelum tanggal mulai")

    curr = start_date
    count = 0
    while curr <= end_date:
        waktu_target = datetime.combine(curr, datetime.strptime("08:00", "%H:%M").time()).replace(tzinfo=WIB)
        existing = db.query(AbsensiLog).filter(
            AbsensiLog.uid == guru.uid,
            func.date(func.timezone('Asia/Jakarta', AbsensiLog.waktu)) == curr
        ).first()

        catatan_str = f"[{req.jenis_izin}] {req.keterangan}" if req.keterangan else f"[{req.jenis_izin}]"
        if existing:
            existing.status = StatusAbsensi.IZIN
            existing.waktu = waktu_target
            existing.catatan = catatan_str
            existing.sumber = "PORTAL_ADMIN"
        else:
            new_log = AbsensiLog(
                uid=guru.uid,
                waktu=waktu_target,
                mode=ModeAbsensi.OFFLINE,
                status=StatusAbsensi.IZIN,
                catatan=catatan_str,
                sumber="PORTAL_ADMIN"
            )
            db.add(new_log)
        curr += timedelta(days=1)
        count += 1

    db.commit()
    return {"status": "success", "message": f"Izin untuk {guru.nama} berhasil dicatat selama {count} hari"}


class GuruIzinUpdateRequest(BaseModel):
    tanggal: str
    jenis_izin: str = "Izin"
    keterangan: Optional[str] = None
    id_guru: Optional[int] = None


@router.put("/guru-izin/{id}")
async def update_guru_izin(
    id: int,
    req: GuruIzinUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    log = db.query(AbsensiLog).filter(AbsensiLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Data izin tidak ditemukan")

    # If current user is guru, verify that this log belongs to them
    if current_user.role == UserRole.guru:
        guru_user = db.query(Guru).filter(Guru.id_user == current_user.id).first()
        if not guru_user or guru_user.uid != log.uid:
            raise HTTPException(status_code=403, detail="Anda hanya dapat mengedit izin milik Anda sendiri")
    elif req.id_guru:
        new_guru = db.query(Guru).filter(Guru.id == req.id_guru).first()
        if new_guru and new_guru.uid:
            log.uid = new_guru.uid

    try:
        target_date = datetime.strptime(req.tanggal, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Format tanggal tidak valid (YYYY-MM-DD)")

    waktu_target = datetime.combine(target_date, datetime.strptime("08:00", "%H:%M").time()).replace(tzinfo=WIB)
    catatan_str = f"[{req.jenis_izin}] {req.keterangan.strip()}" if req.keterangan and req.keterangan.strip() else f"[{req.jenis_izin}]"

    log.waktu = waktu_target
    log.status = StatusAbsensi.IZIN
    log.catatan = catatan_str
    log.sumber = "PORTAL_EDIT"

    db.commit()
    return {"status": "success", "message": "Data izin berhasil diperbarui"}



@router.post("/export-sheets")
async def export_absensi_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    from app.services.google_sheets import send_to_google_sheet

    items = db.query(AbsensiLog).order_by(AbsensiLog.waktu.desc()).limit(1000).all()
    rows = [["ID Log", "UID Kartu", "Nama Guru / Pemilik", "Program", "Waktu Tap (WIB)", "Jalur Sinkronisasi", "Status Kehadiran", "Catatan"]]
    for a in items:
        guru = db.query(Guru).filter((Guru.uid == a.uid) | (func.replace(Guru.uid, " ", "") == a.uid.replace(" ", ""))).first()
        siswa = db.query(Siswa).filter((Siswa.uid == a.uid) | (func.replace(Siswa.uid, " ", "") == a.uid.replace(" ", ""))).first()
        nama = guru.nama if guru else (siswa.nama if siswa else "Kartu Belum Terdaftar")
        prog = guru.kategori_program if guru else (siswa.kategori_program if siswa else "-")
        mode_str = a.mode.value if hasattr(a.mode, 'value') else str(a.mode or "ONLINE")
        status_str = a.status.value if hasattr(a.status, 'value') else str(a.status or "HADIR")
        waktu_wib = a.waktu.astimezone(WIB).strftime("%Y-%m-%d %H:%M:%S WIB") if a.waktu else "-"
        rows.append([a.id, a.uid, nama, prog, waktu_wib, mode_str, status_str, a.catatan or "-"])

    tab_name = "Absensi Guru"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Rekap Log Absensi Guru RFID")

