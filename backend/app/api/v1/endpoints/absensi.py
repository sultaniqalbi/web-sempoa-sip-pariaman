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
    gurus = db.query(Guru).all()
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
    gurus = db.query(Guru).all()
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
    return crud_absensi.get_absensi_by_siswa(db, uid=siswa.uid, skip=skip, limit=limit)

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

    existing_log = db.query(AbsensiLog).filter(
        AbsensiLog.uid == guru.uid,
        func.date(func.timezone('Asia/Jakarta', AbsensiLog.waktu)) == t_date
    ).first()

    if existing_log:
        existing_log.status = req.status
        existing_log.waktu = waktu_target
        existing_log.mode = mode_val
        existing_log.catatan = req.catatan or "Presensi manual admin"
        existing_log.sumber = "PORTAL_ADMIN"
    else:
        new_log = AbsensiLog(
            uid=guru.uid,
            waktu=waktu_target,
            mode=mode_val,
            status=req.status,
            catatan=req.catatan or "Presensi manual admin",
            sumber="PORTAL_ADMIN"
        )
        db.add(new_log)

    db.commit()
    return {"status": "success", "message": f"Presensi untuk {guru.nama} berhasil dicatat pada {req.tanggal}"}


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


@router.post("/export-sheets")
async def export_absensi_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    from app.services.google_sheets import send_to_google_sheet

    items = db.query(AbsensiLog).order_by(AbsensiLog.waktu.desc()).limit(500).all()
    rows = [["ID Log", "UID", "Nama Terkait", "Waktu Tap", "Mode", "Status Absensi"]]
    for a in items:
        guru = db.query(Guru).filter(Guru.uid == a.uid).first()
        siswa = db.query(Siswa).filter(Siswa.uid == a.uid).first()
        nama = guru.nama if guru else (siswa.nama if siswa else "Kartu Belum Terdaftar")
        mode_str = a.mode.value if hasattr(a.mode, 'value') else str(a.mode)
        status_str = a.status.value if hasattr(a.status, 'value') else str(a.status)
        rows.append([a.id, a.uid, nama, a.waktu.strftime("%Y-%m-%d %H:%M:%S") if a.waktu else "-", mode_str, status_str])

    tab_name = "Data Absensi"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Log Absensi RFID")

