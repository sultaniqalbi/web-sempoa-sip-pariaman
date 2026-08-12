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
async def get_pembayaran_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Filter siswa yang sisa_pertemuan <= 2 atau memiliki tagihan MENUNGGAK / OVERDUE,
    disertai draf pesan WhatsApp reminder.
    """
    target_siswa = db.query(Siswa).filter(
        Siswa.is_deleted == False,
        or_(
            Siswa.sisa_pertemuan <= 2,
            Siswa.status_spp == "EXPIRED"
        )
    ).all()

    reminders = []
    for s in target_siswa:
        # Find active pending bill
        bill = db.query(PembayaranPeriode).filter(
            PembayaranPeriode.id_siswa == s.id,
            PembayaranPeriode.status.in_([StatusPembayaran.MENUNGGAK, StatusPembayaran.OVERDUE, StatusPembayaran.PENDING_VERIFIKASI])
        ).order_by(PembayaranPeriode.created_at.desc()).first()

        status_text = "EXPIRED" if s.sisa_pertemuan <= 0 else f"Sisa {s.sisa_pertemuan}x"
        wa_number = s.whatsapp_orang_tua or ""

        wa_draft = f"""Halo {s.nama_orang_tua or 'Orang Tua'},

Pengingat Pembayaran SPP Sempoa SIP TC Pariaman:
- Nama Siswa: {s.nama}
- Status Kuota: {status_text}
- Tagihan: Rp 150.000 (Periode {bill.periode_bulan if bill else datetime.utcnow().strftime('%Y-%m')})

Silakan melakukan pembayaran ke Rekening Resmi:
Bank BCA: 123-456-7890 a/n Sempoa SIP Pariaman

Mohon unggah bukti transfer melalui Portal Ortu setelah pembayaran. Terima kasih!

---
Tim Sempoa SIP TC Pariaman"""

        reminders.append({
            "id_siswa": s.id,
            "nama_siswa": s.nama,
            "nama_orang_tua": s.nama_orang_tua or "-",
            "whatsapp_orang_tua": wa_number,
            "program": s.kategori_program,
            "sisa_pertemuan": s.sisa_pertemuan,
            "status_spp": s.status_spp.value,
            "status_pembayaran": bill.status.value if bill else "MENUNGGAK",
            "jumlah_tagihan": float(bill.jumlah) if bill else 150000.0,
            "wa_draft": wa_draft
        })

    return reminders

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
    items = db.query(PembayaranPeriode).all()
    rows = [["ID Pembayaran", "ID Siswa", "Nama Siswa", "Periode Bulan", "Jumlah", "Status Pembayaran", "Due Date"]]
    for p in items:
        siswa = db.query(Siswa).filter(Siswa.id == p.id_siswa).first()
        nama_siswa = siswa.nama if siswa else "N/A"
        rows.append([p.id, p.id_siswa, nama_siswa, p.periode_bulan, float(p.jumlah), p.status.value, str(p.due_date or "-")])

    service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    tab_name = f"Pembayaran_{datetime.utcnow().strftime('%Y%m%d')}"

    if not service_account_json or not sheet_id or not os.path.exists(service_account_json):
        return {
            "status": "pending",
            "message": "Google Sheets belum dikonfigurasi. Hubungi developer.",
            "worksheet_name": tab_name,
            "rows_written": len(rows) - 1,
            "preview": rows[:5]
        }

    try:
        import gspread
        gc = gspread.service_account(filename=service_account_json)
        sh = gc.open_by_key(sheet_id)
        try:
            ws = sh.worksheet(tab_name)
            ws.clear()
        except Exception:
            ws = sh.add_worksheet(title=tab_name, rows=len(rows)+10, cols=10)
        ws.update("A1", rows)
        return {
            "status": "success",
            "sheet_url": f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit#gid={ws.id}",
            "worksheet_name": tab_name,
            "rows_written": len(rows) - 1,
            "sent_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gagal export ke Google Sheets: {str(e)}",
            "rows_written": len(rows) - 1
        }
