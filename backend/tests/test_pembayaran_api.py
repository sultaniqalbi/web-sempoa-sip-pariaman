import pytest
from app.models.users import User, UserRole
from app.models.siswa import Siswa
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.core.security import create_access_token, get_password_hash

def test_pembayaran_list_unauthorized(client):
    response = client.get("/api/v1/pembayaran")
    assert response.status_code == 401

def test_pembayaran_list_forbidden_role(client, guru_headers):
    response = client.get("/api/v1/pembayaran", headers=guru_headers)
    assert response.status_code == 403

def test_pembayaran_crud_lifecycle_admin(client, admin_headers):
    siswa_data = {
        "uid": "SI-PAY-001",
        "nama": "Siswa Pembayaran",
        "kategori_program": "Sempoa SIP",
        "hari_masuk": "Senin",
        "target_pertemuan": 8,
        "sisa_pertemuan": 8,
        "status_spp": "AKTIF",
        "bio": "Bio",
        "foto_profil": None
    }
    siswa_res = client.post("/api/v1/siswa/", json=siswa_data, headers=admin_headers)
    assert siswa_res.status_code == 201
    siswa_id = siswa_res.json()["id"]

    pay_data = {
        "id_siswa": siswa_id,
        "periode_bulan": "2026-08",
        "jumlah": 150000.00,
        "status": "MENUNGGAK",
        "due_date": "2026-08-18"
    }
    response = client.post("/api/v1/pembayaran/", json=pay_data, headers=admin_headers)
    assert response.status_code == 201
    pay_id = response.json()["id"]

    response = client.get(f"/api/v1/pembayaran/{pay_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["periode_bulan"] == "2026-08"

    response = client.get(f"/api/v1/pembayaran/siswa/{siswa_id}", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.put(f"/api/v1/pembayaran/{pay_id}?status_str=LUNAS", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "LUNAS"

def test_pembayaran_parent_access_control(client, db_session, admin_headers):
    # Create child
    siswa = Siswa(
        uid="SI-PAY-OWN",
        nama="Siswa Sendiri",
        kategori_program="Sempoa SIP",
        hari_masuk="Kamis",
        target_pertemuan=8,
        sisa_pertemuan=8,
        status_spp="AKTIF"
    )
    db_session.add(siswa)
    
    # Create another child
    other_siswa = Siswa(
        uid="SI-PAY-OTHER",
        nama="Siswa Lain",
        kategori_program="Sempoa SIP",
        hari_masuk="Jumat",
        target_pertemuan=8,
        sisa_pertemuan=8,
        status_spp="AKTIF"
    )
    db_session.add(other_siswa)
    db_session.commit()

    # Create parent user linked to the first child
    parent_email = "parent2@test.com"
    parent_user = User(
        email=parent_email,
        password=get_password_hash("parent123"),
        role=UserRole.ortu,
        nama="Parent Own",
        uid_terhubung="SI-PAY-OWN"
    )
    db_session.add(parent_user)
    db_session.commit()

    parent_token = create_access_token(subject=parent_email)
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    # Create payments
    pay1 = PembayaranPeriode(
        id_siswa=siswa.id,
        periode_bulan="2026-08",
        jumlah=150000.00,
        status=StatusPembayaran.MENUNGGAK
    )
    pay2 = PembayaranPeriode(
        id_siswa=other_siswa.id,
        periode_bulan="2026-08",
        jumlah=150000.00,
        status=StatusPembayaran.MENUNGGAK
    )
    db_session.add(pay1)
    db_session.add(pay2)
    db_session.commit()

    # Parent reading own child's payment details should pass
    response = client.get(f"/api/v1/pembayaran/{pay1.id}", headers=parent_headers)
    assert response.status_code == 200

    # Parent reading other child's payment details should fail (403)
    response = client.get(f"/api/v1/pembayaran/{pay2.id}", headers=parent_headers)
    assert response.status_code == 403
