import io
import pytest
from app.models.users import User, UserRole
from app.models.siswa import Siswa
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.bukti_transfer import StatusBuktiTransfer
from app.core.security import create_access_token, get_password_hash

def test_bukti_transfer_flow(client, db_session, admin_headers):
    siswa = Siswa(
        uid="SI-PROOF-001",
        nama="Siswa Proof",
        kategori_program="Sempoa SIP",
        hari_masuk="Selasa",
        target_pertemuan=8,
        sisa_pertemuan=0,
        status_spp="EXPIRED"
    )
    db_session.add(siswa)
    db_session.commit()

    parent_email = "parent@test.com"
    parent_user = User(
        email=parent_email,
        password=get_password_hash("parent123"),
        role=UserRole.ortu,
        nama="Orang Tua",
        uid_terhubung="SI-PROOF-001"
    )
    db_session.add(parent_user)
    db_session.commit()

    parent_token = create_access_token(subject=parent_email)
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    pembayaran = PembayaranPeriode(
        id_siswa=siswa.id,
        periode_bulan="2026-08",
        jumlah=150000.00,
        status=StatusPembayaran.MENUNGGAK
    )
    db_session.add(pembayaran)
    db_session.commit()

    file_content = b"fake image bytes"
    file_obj = io.BytesIO(file_content)
    
    response = client.post(
        "/api/v1/bukti-transfer/",
        headers=parent_headers,
        data={"id_pembayaran": pembayaran.id},
        files={"file": ("proof.jpg", file_obj, "image/jpeg")}
    )
    assert response.status_code == 201
    proof = response.json()
    assert proof["status"] == "pending"
    proof_id = proof["id"]

    db_session.refresh(pembayaran)
    assert pembayaran.status == StatusPembayaran.PENDING_VERIFIKASI

    response = client.put(
        f"/api/v1/bukti-transfer/{proof_id}?status_str=rejected&admin_note=Wrong%20amount",
        headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"
    assert response.json()["admin_note"] == "Wrong amount"

    db_session.refresh(pembayaran)
    assert pembayaran.status == StatusPembayaran.MENUNGGAK

    response = client.put(
        f"/api/v1/bukti-transfer/{proof_id}?status_str=approved",
        headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "approved"

    db_session.refresh(pembayaran)
    db_session.refresh(siswa)
    assert pembayaran.status == StatusPembayaran.LUNAS
    assert siswa.sisa_pertemuan == 8
    assert siswa.status_spp == "AKTIF"

def test_bukti_transfer_invalid_file_type(client, db_session):
    siswa = Siswa(
        uid="SI-PROOF-002",
        nama="Siswa Proof Two",
        kategori_program="Sempoa SIP",
        hari_masuk="Rabu",
        target_pertemuan=8,
        sisa_pertemuan=8,
        status_spp="AKTIF"
    )
    db_session.add(siswa)
    db_session.commit()

    parent_email = "parent_two@test.com"
    parent_user = User(
        email=parent_email,
        password=get_password_hash("parent123"),
        role=UserRole.ortu,
        nama="Orang Tua Dua",
        uid_terhubung="SI-PROOF-002"
    )
    db_session.add(parent_user)
    db_session.commit()

    parent_token = create_access_token(subject=parent_email)
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    pembayaran = PembayaranPeriode(
        id_siswa=siswa.id,
        periode_bulan="2026-08",
        jumlah=150000.00,
        status=StatusPembayaran.MENUNGGAK
    )
    db_session.add(pembayaran)
    db_session.commit()

    # Upload an invalid file type (e.g. text/plain)
    file_content = b"fake plain text"
    file_obj = io.BytesIO(file_content)
    
    response = client.post(
        "/api/v1/bukti-transfer/",
        headers=parent_headers,
        data={"id_pembayaran": pembayaran.id},
        files={"file": ("proof.txt", file_obj, "text/plain")}
    )
    assert response.status_code == 400
    assert "Format file tidak didukung" in response.json()["detail"]

def test_bukti_transfer_file_too_large(client, db_session):
    siswa = Siswa(
        uid="SI-PROOF-003",
        nama="Siswa Proof Three",
        kategori_program="Sempoa SIP",
        hari_masuk="Kamis",
        target_pertemuan=8,
        sisa_pertemuan=8,
        status_spp="AKTIF"
    )
    db_session.add(siswa)
    db_session.commit()

    parent_email = "parent_three@test.com"
    parent_user = User(
        email=parent_email,
        password=get_password_hash("parent123"),
        role=UserRole.ortu,
        nama="Orang Tua Tiga",
        uid_terhubung="SI-PROOF-003"
    )
    db_session.add(parent_user)
    db_session.commit()

    parent_token = create_access_token(subject=parent_email)
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    pembayaran = PembayaranPeriode(
        id_siswa=siswa.id,
        periode_bulan="2026-08",
        jumlah=150000.00,
        status=StatusPembayaran.MENUNGGAK
    )
    db_session.add(pembayaran)
    db_session.commit()

    # Upload file size larger than 5MB
    large_content = b"x" * (6 * 1024 * 1024)
    file_obj = io.BytesIO(large_content)
    
    response = client.post(
        "/api/v1/bukti-transfer/",
        headers=parent_headers,
        data={"id_pembayaran": pembayaran.id},
        files={"file": ("proof.jpg", file_obj, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "Ukuran file terlalu besar" in response.json()["detail"]
