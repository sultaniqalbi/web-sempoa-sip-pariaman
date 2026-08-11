import pytest

def test_read_siswa_list_unauthorized(client):
    response = client.get("/api/v1/siswa")
    assert response.status_code == 401

def test_read_siswa_list_forbidden_role(client, guru_headers):
    # Guru is forbidden from reading all siswa list (admin/owner only)
    response = client.get("/api/v1/siswa", headers=guru_headers)
    assert response.status_code == 403

def test_siswa_crud_lifecycle_admin(client, admin_headers):
    # 1. Create Siswa
    siswa_data = {
        "uid": "SI-TEST-001",
        "nama": "Siswa Test Satu",
        "kategori_program": "Sempoa SIP",
        "hari_masuk": "Senin, Rabu",
        "target_pertemuan": 8,
        "sisa_pertemuan": 8,
        "status_spp": "AKTIF",
        "bio": "Bio Siswa",
        "foto_profil": None
    }
    response = client.post("/api/v1/siswa/", json=siswa_data, headers=admin_headers)
    assert response.status_code == 201
    created_siswa = response.json()
    assert created_siswa["nama"] == "Siswa Test Satu"
    assert created_siswa["uid"] == "SI-TEST-001"
    siswa_id = created_siswa["id"]

    # 2. Get Siswa details
    response = client.get(f"/api/v1/siswa/{siswa_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["nama"] == "Siswa Test Satu"

    # 3. List Siswa (Admin headers)
    response = client.get("/api/v1/siswa/", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # 4. Update Siswa
    update_data = {"nama": "Siswa Test Terupdate"}
    response = client.put(f"/api/v1/siswa/{siswa_id}", json=update_data, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["nama"] == "Siswa Test Terupdate"

    # 5. Soft Delete Siswa
    response = client.delete(f"/api/v1/siswa/{siswa_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["is_deleted"] is True

    # 6. Verify 404 on deleted student details
    response = client.get(f"/api/v1/siswa/{siswa_id}", headers=admin_headers)
    assert response.status_code == 404
