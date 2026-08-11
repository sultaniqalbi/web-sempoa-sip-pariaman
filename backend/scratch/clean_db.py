from sqlalchemy import create_engine, text
from app.core.database import get_database_url

def clean():
    engine = create_engine(get_database_url())
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM absensi_log WHERE uid IN ('SI-QUOTA-001', 'AB-TEST-001', 'SI-PROOF-001', 'SI-TEST-001', 'SI-PAY-001')"))
        conn.execute(text("DELETE FROM bukti_transfer"))
        conn.execute(text("DELETE FROM pembayaran_periode"))
        conn.execute(text("DELETE FROM siswa WHERE uid IN ('SI-PAY-001', 'SI-PROOF-001', 'SI-QUOTA-001', 'SI-TEST-001')"))
        conn.execute(text("DELETE FROM guru WHERE uid IN ('GU-TEST-001')"))
        conn.execute(text("DELETE FROM users WHERE email IN ('parent@test.com')"))
    print("Cleanup successful!")

if __name__ == "__main__":
    clean()
