from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.bukti_transfer import BuktiTransfer, StatusBuktiTransfer
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.siswa import Siswa, StatusSPP

def get_bukti_transfer(db: Session, proof_id: int) -> Optional[BuktiTransfer]:
    return db.query(BuktiTransfer).filter(BuktiTransfer.id == proof_id).first()

def get_bukti_transfer_list(db: Session, skip: int = 0, limit: int = 10) -> List[BuktiTransfer]:
    return db.query(BuktiTransfer).offset(skip).limit(limit).all()

def create_bukti_transfer(db: Session, id_pembayaran: int, file_path: str) -> BuktiTransfer:
    # 1. Create proof record
    db_proof = BuktiTransfer(
        id_pembayaran=id_pembayaran,
        file_path=file_path,
        status=StatusBuktiTransfer.pending
    )
    db.add(db_proof)
    
    # 2. Update payment status to PENDING_VERIFIKASI
    pembayaran = db.query(PembayaranPeriode).filter(PembayaranPeriode.id == id_pembayaran).first()
    if pembayaran:
        pembayaran.status = StatusPembayaran.PENDING_VERIFIKASI
        db.add(pembayaran)

    db.commit()
    db.refresh(db_proof)
    return db_proof

def approve_bukti_transfer(db: Session, db_proof: BuktiTransfer) -> BuktiTransfer:
    db_proof.status = StatusBuktiTransfer.approved
    db.add(db_proof)

    # Update payment to LUNAS and update 30-day due_date
    pembayaran = db.query(PembayaranPeriode).filter(PembayaranPeriode.id == db_proof.id_pembayaran).first()
    if pembayaran:
        pembayaran.status = StatusPembayaran.LUNAS
        pembayaran.due_date = (datetime.utcnow() + timedelta(days=30)).date()
        db.add(pembayaran)

        # Reset student quota to full target and set status back to AKTIF for the new 30-day cycle
        siswa = db.query(Siswa).filter(Siswa.id == pembayaran.id_siswa).first()
        if siswa:
            import json
            siswa.sisa_pertemuan = siswa.target_pertemuan
            siswa.status_spp = StatusSPP.AKTIF
            
            progs = [p.strip() for p in (siswa.kategori_program or "Sempoa SIP").split(",") if p.strip()]
            kuota_dict = {}
            for p in progs:
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
            siswa.kuota_program = json.dumps(kuota_dict)
            db.add(siswa)

    db.commit()
    db.refresh(db_proof)
    return db_proof

def reject_bukti_transfer(db: Session, db_proof: BuktiTransfer, admin_note: Optional[str] = None) -> BuktiTransfer:
    db_proof.status = StatusBuktiTransfer.rejected
    if admin_note:
        db_proof.admin_note = admin_note
    db.add(db_proof)

    # Set payment back to MENUNGGAK
    pembayaran = db.query(PembayaranPeriode).filter(PembayaranPeriode.id == db_proof.id_pembayaran).first()
    if pembayaran:
        pembayaran.status = StatusPembayaran.MENUNGGAK
        db.add(pembayaran)

    db.commit()
    db.refresh(db_proof)
    return db_proof
