import pytest

def test_read_jadwal_list_unauthorized(client):
    response = client.get("/api/v1/jadwal")
    assert response.status_code == 401

def test_create_jadwal_forbidden_role(client, guru_headers):
    # Guru cannot create jadwal (admin/owner only)
    jadwal_data = {
        "id_guru": None,
        "id_siswa": None,
        "hari": "Senin",
        "jam_mulai": "08:00",
        "jam_selesai": "09:30",
        "lokasi": "TC Pariaman"
    }
    response = client.post("/api/v1/jadwal/", json=jadwal_data, headers=guru_headers)
    assert response.status_code == 403

def test_jadwal_crud_lifecycle_admin(client, admin_headers):
    # 1. Create Jadwal with multiple teachers
    jadwal_data = {
        "id_guru": None,
        "guru_ids": "1, 2",
        "id_siswa": None,
        "hari": "Senin",
        "jam_mulai": "08:00",
        "jam_selesai": "09:30",
        "lokasi": "TC Pariaman - Ruang Sempoa",
        "kategori_program": "Sempoa SIP"
    }
    response = client.post("/api/v1/jadwal/", json=jadwal_data, headers=admin_headers)
    assert response.status_code == 201
    created_jadwal = response.json()
    assert created_jadwal["hari"] == "Senin"
    assert created_jadwal["guru_ids"] == "1, 2"
    jadwal_id = created_jadwal["id"]

    # 2. List Jadwal
    response = client.get("/api/v1/jadwal/", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # 3. Update Jadwal
    update_data = {"hari": "Selasa"}
    response = client.put(f"/api/v1/jadwal/{jadwal_id}", json=update_data, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["hari"] == "Selasa"

    # 4. Delete Jadwal
    response = client.delete(f"/api/v1/jadwal/{jadwal_id}", headers=admin_headers)
    assert response.status_code == 204

    # 5. Verify 404 on deleted jadwal update
    response = client.put(f"/api/v1/jadwal/{jadwal_id}", json=update_data, headers=admin_headers)
    assert response.status_code == 404
