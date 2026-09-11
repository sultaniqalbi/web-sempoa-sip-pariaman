import os
from typing import List, Optional
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

WIB = timezone(timedelta(hours=7))

def to_wib(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(WIB)
    return dt.replace(tzinfo=WIB)

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.websocket import manager
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.siswa import Siswa, StatusSPP
from app.models.absensi_log import AbsensiLog, StatusAbsensi, ModeAbsensi
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.core.constants import get_program_spp_nominal
from app.schemas.absensi import AbsensiCreate, AbsensiResponse
from app.crud import absensi as crud_absensi
from app.services.attendance_rules import check_is_guru_late, is_owner_or_direktur
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
    # Ambil seluruh Guru yang aktif dan terdaftar
    gurus = db.query(Guru).filter(Guru.is_deleted == False).all()
    guru_map = {}
    valid_uids_clean = set()
    for g in gurus:
        if g.uid:
            u_clean = g.uid.strip().upper()
            u_nospace = u_clean.replace(" ", "")
            guru_map[u_clean] = g
            guru_map[u_nospace] = g
            valid_uids_clean.add(u_clean)
            valid_uids_clean.add(u_nospace)

    logs = (
        db.query(AbsensiLog)
        .order_by(AbsensiLog.waktu.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Auto-reconcile: sinkronkan status log kehadiran guru sesuai aturan resmi keterlambatan:
    # 1. Guru datang <= 08:00 WIB (atau sesuai toleransi jadwal khusus) -> HADIR
    # 2. Guru datang lewat toleransi keterlambatan -> TERLAMBAT
    # 3. Direktur / Owner -> selalu HADIR (bebas keterlambatan & denda)
    try:
        needs_commit = False
        for log_entry in logs:
            if log_entry.status in [StatusAbsensi.HADIR, StatusAbsensi.TERLAMBAT]:
                u_clean = log_entry.uid.strip().upper().replace(" ", "") if log_entry.uid else ""
                matched_g = guru_map.get(u_clean)
                if matched_g:
                    w_time = to_wib(log_entry.waktu)
                    should_be_late = check_is_guru_late(matched_g, w_time)
                    expected_status = StatusAbsensi.TERLAMBAT if should_be_late else StatusAbsensi.HADIR
                    if log_entry.status != expected_status:
                        log_entry.status = expected_status
                        needs_commit = True

        if needs_commit:
            db.commit()
    except Exception:
        db.rollback()

    # Pre-calculate log keterlambatan yang belum lunas per guru secara kronologis
    # Aturan resmi:
    # 1. Jika guru TIDAK telat pada log hari tersebut (misal Hadir Tepat Waktu atau Izin), denda = 0 (tampil Rp. -).
    # 2. Jika guru TELAT pada log hari tersebut, denda diakumulasikan dengan denda keterlambatan sebelumnya yang belum lunas.
    # 3. Direktur / Owner selalu BEBAS DENDA (denda = 0).
    norm_uid_expr = func.replace(func.upper(AbsensiLog.uid), " ", "")
    late_filter = [
        AbsensiLog.status == StatusAbsensi.TERLAMBAT,
        or_(AbsensiLog.status_denda != "LUNAS", AbsensiLog.status_denda == None)
    ]
    if valid_uids_clean:
        late_filter.append(norm_uid_expr.in_(list(valid_uids_clean)))

    unpaid_late_rows = (
        db.query(norm_uid_expr, AbsensiLog.waktu)
        .filter(*late_filter)
        .order_by(AbsensiLog.waktu.asc())
        .all()
    )

    # Ambil seluruh Siswa yang aktif untuk pemetaan tap siswa
    siswas = db.query(Siswa).filter(Siswa.is_deleted == False).all()
    siswa_map = {}
    for s in siswas:
        if s.uid:
            s_clean = s.uid.strip().upper()
            siswa_map[s_clean] = s
            siswa_map[s_clean.replace(" ", "")] = s

    guru_unpaid_late_times = {}
    for uid_val, w_time in unpaid_late_rows:
        if uid_val:
            clean_k = uid_val.strip().upper()
            if clean_k not in guru_unpaid_late_times:
                guru_unpaid_late_times[clean_k] = []
            guru_unpaid_late_times[clean_k].append(to_wib(w_time))

    result = []
    for log in logs:
        clean_uid = log.uid.strip().upper() if log.uid else ""
        nospace_uid = clean_uid.replace(" ", "")
        g = guru_map.get(clean_uid) or guru_map.get(nospace_uid)

        if not g:
            # Cek apakah kartu milik siswa
            s = siswa_map.get(clean_uid) or siswa_map.get(nospace_uid)
            resp = AbsensiResponse.model_validate(log)
            if log.waktu:
                resp.waktu = to_wib(log.waktu)
            if log.waktu_keluar:
                resp.waktu_keluar = to_wib(log.waktu_keluar)
            if s:
                resp.guru_nama = s.nama
                resp.kategori_program = s.kategori_program
                resp.role = "siswa"
            else:
                resp.guru_nama = "Kartu Belum Terdaftar"
                resp.role = "guru"
            resp.denda_terakumulasi = 0
            resp.status_denda = "BELUM_LUNAS"
            result.append(resp)
            continue

        resp = AbsensiResponse.model_validate(log)
        if log.waktu:
            resp.waktu = to_wib(log.waktu)
                
        if log.waktu_keluar:
            resp.waktu_keluar = to_wib(log.waktu_keluar)

        norm_g_uid = g.uid.strip().upper().replace(" ", "") if g.uid else ""
        resp.guru_nama = g.nama
        resp.kategori_program = g.kategori_program
        resp.role = "guru"
        resp.status_denda = getattr(log, "status_denda", None) or "BELUM_LUNAS"

        # HANYA Direktur / Owner yang BEBAS DENDA (denda selalu 0)
        if is_owner_or_direktur(g):
            resp.denda_terakumulasi = 0
        elif log.status != StatusAbsensi.TERLAMBAT:
            # Jika tidak terlambat, denda tidak berlaku / Rp. -
            resp.denda_terakumulasi = 0
        elif resp.status_denda == "LUNAS":
            # Jika keterlambatan ini sudah ditandai Lunas
            resp.denda_terakumulasi = 0
        else:
            # Jika terlambat dan belum lunas: hitung total denda keterlambatan belum lunas hingga waktu log ini
            late_times = guru_unpaid_late_times.get(norm_g_uid) or guru_unpaid_late_times.get(nospace_uid) or []
            log_wib = to_wib(log.waktu)
            accum_count = sum(1 for lt in late_times if lt is not None and log_wib is not None and lt <= log_wib)
            if accum_count == 0:
                accum_count = 1
            resp.denda_terakumulasi = accum_count * 1000

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
            resp.waktu = to_wib(log.waktu)
        if log.waktu_keluar:
            resp.waktu_keluar = to_wib(log.waktu_keluar)

        resp.status_denda = getattr(log, "status_denda", None) or "BELUM_LUNAS"
        resp.denda_terakumulasi = 0

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

        # Update SPP status based on remaining meetings (khusus non-TK karena TK berbasis kalender bulanan)
        is_tk = "tk" in (siswa.kategori_program or "").lower()
        if not is_tk:
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
                        jumlah=get_program_spp_nominal(db, siswa.kategori_program, getattr(siswa, "paket_jadwal", None)),
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
    status_denda: Optional[str] = None
    pembayaran_denda: Optional[str] = None


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

    # Tangani fitur Pembayaran Denda (Lunas / Reset denda keterlambatan guru ke 0)
    denda_choice = update_dict.pop("pembayaran_denda", None) or update_dict.pop("status_denda", None)
    if denda_choice:
        choice_clean = str(denda_choice).strip().upper()
        if choice_clean == "LUNAS":
            log.status_denda = "LUNAS"
            # Reset total denda/keterlambatan guru ini: tandai semua log TERLAMBAT yang belum lunas menjadi LUNAS
            target_uid = log.uid.strip().upper().replace(" ", "") if log.uid else ""
            if target_uid:
                norm_uid_expr = func.replace(func.upper(AbsensiLog.uid), " ", "")
                db.query(AbsensiLog).filter(
                    norm_uid_expr == target_uid,
                    AbsensiLog.status == StatusAbsensi.TERLAMBAT
                ).update({AbsensiLog.status_denda: "LUNAS"}, synchronize_session=False)
        elif choice_clean == "BELUM_LUNAS":
            log.status_denda = "BELUM_LUNAS"

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
        if hasattr(log, key):
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

    resp.status_denda = getattr(log, "status_denda", None) or "BELUM_LUNAS"

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
        is_late = check_is_guru_late(guru, waktu_target)
        if req.status == StatusAbsensi.TERLAMBAT:
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

    # Pre-fetch gurus and siswas into hash maps (eliminates 2000 N+1 queries)
    gurus = db.query(Guru).filter(Guru.is_deleted == False).all()
    g_map = {}
    for g in gurus:
        if g.uid:
            g_map[g.uid.strip().upper()] = g
            g_map[g.uid.strip().upper().replace(" ", "")] = g

    siswas = db.query(Siswa).filter(Siswa.is_deleted == False).all()
    s_map = {}
    for s in siswas:
        if s.uid:
            s_map[s.uid.strip().upper()] = s
            s_map[s.uid.strip().upper().replace(" ", "")] = s

    rows = [["ID Log", "UID Kartu", "Nama Guru / Pemilik", "Program", "Waktu Tap (WIB)", "Jalur Sinkronisasi", "Status Kehadiran", "Catatan"]]
    for a in items:
        clean_u = a.uid.strip().upper() if a.uid else ""
        nospace_u = clean_u.replace(" ", "")
        guru = g_map.get(clean_u) or g_map.get(nospace_u)
        if not guru:
            continue
        nama = guru.nama
        prog = guru.kategori_program or "-"
        mode_str = a.mode.value if hasattr(a.mode, 'value') else str(a.mode or "ONLINE")
        status_str = a.status.value if hasattr(a.status, 'value') else str(a.status or "HADIR")
        waktu_wib = a.waktu.astimezone(WIB).strftime("%Y-%m-%d %H:%M:%S WIB") if a.waktu else "-"
        rows.append([a.id, a.uid, nama, prog, waktu_wib, mode_str, status_str, a.catatan or "-"])

    tab_name = "Absensi Guru"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Rekap Log Absensi Guru RFID")

