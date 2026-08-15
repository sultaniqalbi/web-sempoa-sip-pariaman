import os
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.siswa import Siswa
from app.schemas.pembayaran import PembayaranCreate, PembayaranResponse
from app.crud import pembayaran as crud_pembayaran

router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

@router.get("/", response_model=List[PembayaranResponse])
async def read_pembayaran_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in [UserRole.admin, UserRole.owner]:
        return crud_pembayaran.get_pembayaran_list(db, skip=skip, limit=limit)
    elif current_user.role == UserRole.ortu:
        if not current_user.uid_terhubung:
            return []
        siswa = db.query(Siswa).filter(
            or_(Siswa.id == (int(current_user.uid_terhubung) if current_user.uid_terhubung.isdigit() else -1), Siswa.uid == current_user.uid_terhubung),
            Siswa.is_deleted == False
        ).first()
        if not siswa:
            return []
        return db.query(PembayaranPeriode).filter(PembayaranPeriode.id_siswa == siswa.id).offset(skip).limit(limit).all()
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Role tidak diizinkan untuk melihat tagihan pembayaran"
    )

def get_spp_nominal(program: Optional[str]) -> float:
    prog = (program or "").lower()
    if "sempoa" in prog:
        return 350000.00
    return 200000.00

@router.get("/reminder")
@router.get("/reminder-spp")
async def get_pembayaran_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Filter dan kualifikasi status SPP siswa (Lancar / Peringatan / Urgent / Hangus)
    berdasarkan persentase sisa_pertemuan dan batas siklus 30 hari,
    disertai draf pesan WhatsApp Peringatan & Tagihan Urgent.
    """
    all_siswa = db.query(Siswa).filter(Siswa.is_deleted == False).order_by(Siswa.sisa_pertemuan.asc()).all()

    siswa_reminders = []
    lancar_count = 0
    peringatan_count = 0
    urgent_count = 0
    today = datetime.utcnow().date()

    for s in all_siswa:
        bill = db.query(PembayaranPeriode).filter(
            PembayaranPeriode.id_siswa == s.id,
            PembayaranPeriode.status.in_([StatusPembayaran.MENUNGGAK, StatusPembayaran.OVERDUE, StatusPembayaran.PENDING_VERIFIKASI])
        ).order_by(PembayaranPeriode.created_at.desc()).first()

        # Ambil pembayaran lunas terakhir untuk menghitung siklus 30 hari
        last_lunas = db.query(PembayaranPeriode).filter(
            PembayaranPeriode.id_siswa == s.id,
            PembayaranPeriode.status == StatusPembayaran.LUNAS
        ).order_by(PembayaranPeriode.created_at.desc()).first()

        sisa = s.sisa_pertemuan if s.sisa_pertemuan is not None else 0
        target = s.target_pertemuan if s.target_pertemuan and s.target_pertemuan > 0 else 8
        persen = (sisa / target) * 100 if target > 0 else 0
        wa_num = s.whatsapp_orang_tua or ""
        ortu_name = s.nama_orang_tua or "Orang Tua"
        
        default_spp = get_spp_nominal(s.kategori_program)
        jumlah_tagihan = float(bill.jumlah) if bill else default_spp

        # Hitung siklus 30 hari
        if last_lunas and last_lunas.due_date:
            due_date = last_lunas.due_date
        elif last_lunas and last_lunas.created_at:
            due_date = last_lunas.created_at.date() + timedelta(days=30)
        elif s.created_at:
            due_date = s.created_at.date() + timedelta(days=30)
        else:
            due_date = today + timedelta(days=30)

        days_remaining = (due_date - today).days
        is_expired_30_hari = days_remaining < 0
        is_hangus = is_expired_30_hari and sisa > 0
        due_date_str = str(due_date)

        # Thresholds:
        # Merah/Urgent: Lewat 30 hari (expired/hangus) ATAU sisa < 20%
        # Kuning/Peringatan: Belum lewat 30 hari DAN sisa <= 40%
        # Hijau/Lancar: Sisa > 40% dan masih dalam 30 hari
        if is_expired_30_hari:
            status_code = "urgent"
            status_label = f"Hangus (Lewat {abs(days_remaining)} Hari)" if is_hangus else "Expired (Lewat 30 Hari)"
            color = "merah"
            urgent_count += 1
        elif persen < 20:
            status_code = "urgent"
            status_label = "Urgent (< 20%)"
            color = "merah"
            urgent_count += 1
        elif persen <= 40:
            status_code = "peringatan"
            status_label = "Peringatan (Siap Bayar)"
            color = "kuning"
            peringatan_count += 1
        else:
            status_code = "lancar"
            status_label = "Lancar"
            color = "hijau"
            lancar_count += 1

        # Kuning Template (Peringatan Persiapan SPP - Tanpa Rekening)
        wa_peringatan = f"""Assalamualaikum Ibu/Pak {ortu_name},

Kami ingin memberitahukan bahwa kuota pertemuan {s.nama} untuk program {s.kategori_program} tinggal sedikit (sisa {sisa} sesi / {int(persen)}%).

👤 Nama Anak: {s.nama}
📚 Program: {s.kategori_program}
📊 Sisa Pertemuan: {sisa} / {target} sesi
📅 Batas Siklus 30 Hari: {due_date_str} (sisa {max(0, days_remaining)} hari)

Mohon bersiap untuk melakukan pembayaran SPP periode berikutnya.

---
Tim Sempoa SIP TC Pariaman
Admin: 082385813163 | Owner: 08126784986"""

        # Merah Template (Tagihan Urgent / Expired - Dilengkapi Rekening Resmi ZULHEMAWATI)
        alasan_merah = "Masa aktif 30 hari telah berakhir (sisa pertemuan hangus)" if is_hangus else ("Masa aktif 30 hari telah berakhir" if is_expired_30_hari else f"Sisa pertemuan tinggal {sisa} sesi ({int(persen)}%)")
        wa_urgent = f"""Assalamualaikum Ibu/Pak {ortu_name},

⚠️ PEMBERITAHUAN TAGIHAN SPP ⚠️

{alasan_merah} untuk Ananda {s.nama} pada program {s.kategori_program}.

👤 Nama Anak: {s.nama}
📚 Program: {s.kategori_program}
📊 Sisa Pertemuan: {sisa} / {target} sesi {'(HANGUS)' if is_hangus else ''}
💰 Total Tagihan: Rp {int(jumlah_tagihan):,}
📅 Batas Siklus: {due_date_str}

🏦 REKENING RESMI PEMBAYARAN:
1. Bank BRI
   No. Rekening: 0321 0100 2859536
   A/N: ZULHEMAWATI
2. Bank BPD (Bank Nagari)
   No. Rekening: 0500 0201 085065
   A/N: ZULHEMAWATI

Mohon segera lakukan pembayaran dan konfirmasi via WhatsApp ke:
📱 Owner: 08126784986
📱 Admin: 082385813163

---
Tim Sempoa SIP TC Pariaman""".replace(",", ".")

        siswa_reminders.append({
            "id_siswa": s.id,
            "nama_siswa": s.nama,
            "nama_orang_tua": ortu_name,
            "whatsapp_orang_tua": wa_num,
            "program": s.kategori_program,
            "sisa_pertemuan": sisa,
            "target_pertemuan": target,
            "paket_jadwal": s.paket_jadwal or "",
            "status_spp": s.status_spp.value if hasattr(s.status_spp, 'value') else str(s.status_spp),
            "status": status_code,
            "status_label": status_label,
            "color": color,
            "due_date": due_date_str,
            "days_remaining": days_remaining,
            "is_expired_30_hari": is_expired_30_hari,
            "is_hangus": is_hangus,
            "jadwal_pembayaran_berikutnya": due_date_str,
            "jumlah_tagihan": jumlah_tagihan,
            "wa_draft": wa_urgent if status_code == "urgent" else wa_peringatan,
            "wa_draft_peringatan": wa_peringatan,
            "wa_draft_urgent": wa_urgent
        })

    return {
        "summary": {
            "total": len(all_siswa),
            "lancar": lancar_count,
            "peringatan": peringatan_count,
            "urgent": urgent_count
        },
        "siswa": siswa_reminders
    }

@router.get("/summary-for-admin")
async def get_summary_for_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    reminders_data = await get_pembayaran_reminders(db, current_user)
    return reminders_data["summary"]

@router.get("/{id}", response_model=PembayaranResponse)
async def read_pembayaran(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pembayaran = crud_pembayaran.get_pembayaran(db, pembayaran_id=id)
    if not pembayaran:
        raise HTTPException(status_code=404, detail="Tagihan pembayaran tidak ditemukan")
    
    if current_user.role in [UserRole.admin, UserRole.owner]:
        return pembayaran
    
    if current_user.role == UserRole.ortu:
        siswa = db.query(Siswa).filter(Siswa.id == pembayaran.id_siswa).first()
        if siswa and (str(siswa.id) == current_user.uid_terhubung or siswa.uid == current_user.uid_terhubung):
            return pembayaran

    raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke tagihan pembayaran ini")

@router.get("/siswa/{siswa_id}", response_model=List[PembayaranResponse])
async def read_pembayaran_by_siswa(
    siswa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in [UserRole.admin, UserRole.owner]:
        return crud_pembayaran.get_pembayaran_by_siswa(db, siswa_id=siswa_id)

    if current_user.role == UserRole.ortu:
        siswa = db.query(Siswa).filter(Siswa.id == siswa_id).first()
        if siswa and (str(siswa.id) == current_user.uid_terhubung or siswa.uid == current_user.uid_terhubung):
            return crud_pembayaran.get_pembayaran_by_siswa(db, siswa_id=siswa_id)

    raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke tagihan pembayaran siswa ini")

@router.post("/", response_model=PembayaranResponse, status_code=status.HTTP_201_CREATED)
async def create_new_pembayaran(
    pembayaran_in: PembayaranCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    siswa = db.query(Siswa).filter(Siswa.id == pembayaran_in.id_siswa, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")
    return crud_pembayaran.create_pembayaran(db, pembayaran=pembayaran_in)

@router.put("/{id}", response_model=PembayaranResponse)
async def update_payment_status_endpoint(
    id: int,
    status_str: StatusPembayaran,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    pembayaran = crud_pembayaran.get_pembayaran(db, pembayaran_id=id)
    if not pembayaran:
        raise HTTPException(status_code=404, detail="Tagihan pembayaran tidak ditemukan")
    return crud_pembayaran.update_pembayaran_status(db, db_pembayaran=pembayaran, status=status_str)

@router.post("/export-sheets")
async def export_pembayaran_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    from app.services.google_sheets import send_to_google_sheet

    items = db.query(PembayaranPeriode).all()
    rows = [["ID Pembayaran", "ID Siswa", "Nama Siswa", "Periode Bulan", "Jumlah", "Status Pembayaran", "Due Date"]]
    for p in items:
        siswa = db.query(Siswa).filter(Siswa.id == p.id_siswa).first()
        nama_siswa = siswa.nama if siswa else "N/A"
        status_str = p.status.value if hasattr(p.status, 'value') else str(p.status)
        rows.append([p.id, p.id_siswa, nama_siswa, p.periode_bulan, float(p.jumlah), status_str, str(p.due_date or "-")])

    tab_name = f"Pembayaran_{datetime.utcnow().strftime('%Y%m%d')}"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Data Pembayaran SPP")

