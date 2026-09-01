import os
import sys
from sqlalchemy import text
from app.core.database import SessionLocal

def fix_absensi_timezone():
    """
    Memperbaiki timestamp log absensi lama yang tersimpan tanpa offset timezone WIB (UTC+7).
    Data yang tadinya tersimpan sebagai 20:48 UTC diubah menjadi 13:48 UTC sehingga
    saat ditampilkan di browser zona WIB (Asia/Jakarta) akan tepat 20:48 WIB.
    """
    db = SessionLocal()
    try:
        print("[Timezone Fix] Memeriksa dan memperbaiki timestamp log absensi...")
        
        # Cari dan sesuaikan data log yang bergeser ke hari berikutnya (> 00:00 - 05:00 subuh tanggal 2 Sep)
        result = db.execute(text("""
            UPDATE absensi_log 
            SET waktu = waktu - INTERVAL '7 hours'
            WHERE waktu >= '2026-09-01 00:00:00+00' 
              AND waktu <= '2026-09-02 06:00:00+00';
        """))
        db.commit()
        print(f"[Timezone Fix] Selesai! {result.rowcount} baris log absensi berhasil disinkronkan ke WIB.")
    except Exception as e:
        db.rollback()
        print(f"[Timezone Fix] Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_absensi_timezone()
