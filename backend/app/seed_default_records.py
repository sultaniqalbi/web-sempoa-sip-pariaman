import logging
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.siswa import Siswa, StatusSPP
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.jadwal import Jadwal

logger = logging.getLogger("seed_default_records")

def restore_initial_guru_and_siswa(db: Session = None):
    """
    Restore default 1 Guru (Rehan Sinengsih) and 1 Siswa (Muhammad Farhan)
    with their associated User login accounts and permanent passwords.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 1. Check or create Guru: Rehan Sinengsih
        existing_guru = db.query(Guru).filter(
            (func.lower(Guru.nama).contains("rehan")) | (Guru.whatsapp_guru == "085128067691")
        ).first()

        if not existing_guru:
            new_guru = Guru(
                uid="GURU-001",
                nama="Rehan Sinengsih",
                nama_panggilan="Rehan",
                tempat_lahir="Pariaman",
                tanggal_lahir=date(1999, 4, 15),
                umur=27,
                asal_sekolah="Universitas Negeri Padang",
                kategori_program="Sempoa SIP",
                hari_wajib="Senin, Rabu, Jumat",
                target_kehadiran=12,
                whatsapp_guru="085128067691",
                alamat="Pariaman, Sumatera Barat",
                paket_pengajaran="Reguler",
                mode_kelas="OFFLINE"
            )
            db.add(new_guru)
            db.flush()
            existing_guru = new_guru
            logger.info(f"Created default Guru: {existing_guru.nama} (ID: {existing_guru.id})")

        # 2. Check or create User for Guru
        guru_email = "rehansinengsih@sempoasippariaman.com"
        guru_user = db.query(User).filter(func.lower(User.email) == guru_email.lower()).first()
        if not guru_user:
            guru_user = User(
                email=guru_email,
                password=get_password_hash("rehan12345"),
                role=UserRole.guru,
                nama=existing_guru.nama,
                uid_terhubung=str(existing_guru.id)
            )
            db.add(guru_user)
            logger.info(f"Created User for Guru: {guru_email}")
        else:
            guru_user.uid_terhubung = str(existing_guru.id)

        # 3. Check or create Siswa: Muhammad Farhan
        existing_siswa = db.query(Siswa).filter(
            (func.lower(Siswa.nama).contains("farhan")) | (Siswa.is_deleted == False)
        ).first()

        if not existing_siswa:
            new_siswa = Siswa(
                uid="SISWA-001",
                nama="Muhammad Farhan",
                nama_panggilan="Farhan",
                umur=8,
                kelas_sekolah="Kelas 3 SD",
                kategori_program="Sempoa",
                paket_jadwal="Senin & Rabu 14:00 - 15:30",
                hari_masuk="Senin, Rabu",
                id_guru=existing_guru.id,
                target_pertemuan=8,
                sisa_pertemuan=8,
                status_spp=StatusSPP.AKTIF,
                nama_orang_tua="Bpk. Hendra",
                whatsapp_orang_tua="081234567890",
                alamat="Pariaman Tengah",
                tempat_lahir="Pariaman",
                tanggal_lahir=date(2018, 6, 10),
                asal_sekolah="SDN 01 Pariaman"
            )
            db.add(new_siswa)
            db.flush()
            existing_siswa = new_siswa
            logger.info(f"Created default Siswa: {existing_siswa.nama} (ID: {existing_siswa.id})")

            # Create initial payment
            pembayaran = PembayaranPeriode(
                id_siswa=new_siswa.id,
                periode_bulan=datetime.utcnow().strftime("%Y-%m"),
                jumlah=250000.0,
                status=StatusPembayaran.LUNAS
            )
            db.add(pembayaran)

        # 4. Check or create User for Ortu
        ortu_email = "farhan@sempoasippariaman.com"
        ortu_user = db.query(User).filter(func.lower(User.email) == ortu_email.lower()).first()
        if not ortu_user:
            ortu_user = User(
                email=ortu_email,
                password=get_password_hash("farhan12345"),
                role=UserRole.ortu,
                nama=existing_siswa.nama_orang_tua or f"Ortu {existing_siswa.nama}",
                uid_terhubung=str(existing_siswa.id)
            )
            db.add(ortu_user)
            logger.info(f"Created User for Ortu: {ortu_email}")
        else:
            ortu_user.uid_terhubung = str(existing_siswa.id)

        db.commit()
        logger.info("Restoration completed successfully.")
        return {"status": "success", "guru": existing_guru.nama, "siswa": existing_siswa.nama}
    except Exception as e:
        db.rollback()
        logger.error(f"Error restoring records: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    restore_initial_guru_and_siswa()
