import os
from typing import List, Optional
from datetime import datetime
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

@router.get("/reminder")
@router.get("/reminder-spp")
async def get_pembayaran_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Filter dan kualifikasi status SPP siswa (Lancar / Peringatan / Urgent)
    berdasarkan persentase sisa_pertemuan (Hijau >40%, Kuning 20-40%, Merah <20%),
    disertai draf pesan WhatsApp Peringatan & Tagihan Urgent.
    """
    all_siswa = db.query(Siswa).filter(Siswa.is_deleted == False).order_by(Siswa.sisa_pertemuan.asc()).all()

    siswa_reminders = []
    lancar_count = 0
    peringatan_count = 0
    urgent_count = 0

    next_date_default = (datetime.utcnow()).strftime("%Y-%m-20")

    for s in all_siswa:
        bill = db.query(PembayaranPeriode).filter(
            PembayaranPeriode.id_siswa == s.id,
            PembayaranPeriode.status.in_([StatusPembayaran.MENUNGGAK, StatusPembayaran.OVERDUE, StatusPembayaran.PENDING_VERIFIKASI])
        ).order_by(PembayaranPeriode.created_at.desc()).first()

        sisa = s.sisa_pertemuan if s.sisa_pertemuan is not None else 8
        wa_num = s.whatsapp_orang_tua or ""
        ortu_name = s.nama_orang_tua or "Orang Tua"
        jumlah_tagihan = float(bill.jumlah) if bill else 150000.0
        due_date_str = str(bill.due_date) if (bill and bill.due_date) else next_date_default

        # Thresholds: >40% (>3/8) = Lancar, 20-40% (2-3/8) = Peringatan, <20% (<=1/8) = Urgent
        if sisa > 3:
            status_code = "lancar"
            status_label = "Lancar"
            color = "hijau"
            lancar_count += 1
        elif sisa >= 2:
            status_code = "peringatan"
            status_label = "Peringatan"
            color = "kuning"
            peringatan_count += 1
        else:
            status_code = "urgent"
            status_label = "Urgent"
            color = "merah"
            urgent_count += 1

        # Kuning Template (Peringatan)
        wa_peringatan = f"""Assalamualaikum Ibu/Pak {ortu_name},

Kami ingin memberitahukan bahwa kuota pertemuan {s.nama} untuk program {s.kategori_program} tinggal sedikit.

👤 Nama Anak: {s.nama}
📚 Program: {s.kategori_program}
📊 Sisa Pertemuan: {sisa} kali
📅 Jadwal Pembayaran Berikutnya: {due_date_str}

Silakan hubungi kami untuk informasi lebih lanjut.

---
Tim Sempoa SIP TC Pariaman"""

        # Merah Template (Tagihan Urgent)
        wa_urgent = f"""Assalamualaikum Ibu/Pak {ortu_name},

⚠️ PEMBERITAHUAN PENTING ⚠️

Kuota pertemuan {s.nama} untuk program {s.kategori_program} hampir habis!

👤 Nama Anak: {s.nama}
📚 Program: {s.kategori_program}
📊 Sisa Pertemuan: {sisa} kali (URGENT)
💰 Total Tagihan: Rp {int(jumlah_tagihan):,}
📅 Jadwal Pembayaran Berikutnya: {due_date_str}

🏦 INFO TRANSFER:
Bank: BCA
A/N: Sempoa SIP TC Pariaman
No. Rekening: 123-456-7890

Mohon segera lakukan pembayaran. Hubungi kami jika ada pertanyaan.

---
Tim Sempoa SIP TC Pariaman""".replace(",", ".")

        siswa_reminders.append({
            "id_siswa": s.id,
            "nama_siswa": s.nama,
            "nama_orang_tua": ortu_name,
            "whatsapp_orang_tua": wa_num,
            "program": s.kategori_program,
            "sisa_pertemuan": sisa,
            "status_spp": s.status_spp.value if hasattr(s.status_spp, 'value') else str(s.status_spp),
            "status": status_code,
            "status_label": status_label,
            "color": color,
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

