"""
Seed script: create dummy siswa & guru accounts for portal access.
Run inside the backend container:
  docker exec sempoa-backend python /app/seed_dummy.py
"""
from app.core.database import SessionLocal
from app.models.users import User, UserRole
from app.models.siswa import Siswa, StatusSPP
from app.models.guru import Guru
from app.core.security import get_password_hash

db = SessionLocal()

# ── 1. Dummy Guru ──────────────────────────────────────
guru_uid = "GR-DUMMY"
existing_guru = db.query(Guru).filter(Guru.uid == guru_uid).first()
if not existing_guru:
    guru = Guru(
        uid=guru_uid,
        nama="Guru Demo",
        kategori_program="Sempoa SIP",
        hari_wajib="Senin,Rabu,Jumat",
        target_kehadiran=12,
        whatsapp_guru="628123456789",
    )
    db.add(guru)
    db.flush()
    print(f"[+] Guru record created: {guru_uid}")
else:
    guru = existing_guru
    print(f"[=] Guru record already exists: {guru_uid}")

guru_email = "guru@demo.com"
guru_pass = "guru1234"
existing_guru_user = db.query(User).filter(User.email == guru_email).first()
if not existing_guru_user:
    guru_user = User(
        email=guru_email,
        password=get_password_hash(guru_pass),
        role=UserRole.guru,
        nama="Guru Demo",
        uid_terhubung=guru_uid,
    )
    db.add(guru_user)
    print(f"[+] Guru user created: {guru_email} / {guru_pass}")
else:
    print(f"[=] Guru user already exists: {guru_email}")

# ── 2. Dummy Siswa ─────────────────────────────────────
siswa_uid = "SW-DUMMY"
existing_siswa = db.query(Siswa).filter(Siswa.uid == siswa_uid).first()
if not existing_siswa:
    siswa = Siswa(
        uid=siswa_uid,
        nama="Siswa Demo",
        kategori_program="Sempoa SIP",
        hari_masuk="Selasa,Kamis",
        id_guru=guru.id,
        target_pertemuan=8,
        sisa_pertemuan=6,
        status_spp=StatusSPP.AKTIF,
        nama_orang_tua="Ortu Demo",
        whatsapp_orang_tua="628987654321",
    )
    db.add(siswa)
    print(f"[+] Siswa record created: {siswa_uid}")
else:
    print(f"[=] Siswa record already exists: {siswa_uid}")

siswa_email = "siswa@demo.com"
siswa_pass = "siswa1234"
existing_siswa_user = db.query(User).filter(User.email == siswa_email).first()
if not existing_siswa_user:
    siswa_user = User(
        email=siswa_email,
        password=get_password_hash(siswa_pass),
        role=UserRole.siswa,
        nama="Siswa Demo",
        uid_terhubung=siswa_uid,
    )
    db.add(siswa_user)
    print(f"[+] Siswa user created: {siswa_email} / {siswa_pass}")
else:
    print(f"[=] Siswa user already exists: {siswa_email}")

# ── 3. Dummy Ortu (linked to siswa) ───────────────────
ortu_email = "ortu@demo.com"
ortu_pass = "ortu1234"
existing_ortu_user = db.query(User).filter(User.email == ortu_email).first()
if not existing_ortu_user:
    ortu_user = User(
        email=ortu_email,
        password=get_password_hash(ortu_pass),
        role=UserRole.ortu,
        nama="Ortu Demo",
        uid_terhubung=siswa_uid,
    )
    db.add(ortu_user)
    print(f"[+] Ortu user created: {ortu_email} / {ortu_pass}")
else:
    print(f"[=] Ortu user already exists: {ortu_email}")

db.commit()
db.close()

print("\n✅ Selesai! Akun dummy siap dipakai:")
print(f"   Guru  → {guru_email} / {guru_pass}")
print(f"   Siswa → {siswa_email} / {siswa_pass}")
print(f"   Ortu  → {ortu_email} / {ortu_pass}")
