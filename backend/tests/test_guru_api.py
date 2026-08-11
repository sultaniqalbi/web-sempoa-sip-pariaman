import pytest

def test_read_guru_list_unauthorized(client):
    response = client.get("/api/v1/guru")
    assert response.status_code == 401

def test_read_guru_list_forbidden_role(client, guru_headers):
    response = client.get("/api/v1/guru", headers=guru_headers)
    assert response.status_code == 403

def test_guru_crud_lifecycle_admin(client, admin_headers):
    # 1. Create Guru
    guru_data = {
        "uid": "GU-TEST-001",
        "nama": "Guru Test Satu",
        "kategori_program": "Sempoa SIP",
        "hari_wajib": "Senin, Selasa, Kamis",
        "target_kehadiran": 12,
        "bio": "Bio Guru",
        "foto_profil": None
    }
    response = client.post("/api/v1/guru/", json=guru_data, headers=admin_headers)
    assert response.status_code == 201
    created_guru = response.json()
    assert created_guru["nama"] == "Guru Test Satu"
    assert created_guru["uid"] == "GU-TEST-001"
    guru_id = created_guru["id"]

    # 2. Get Guru details
    response = client.get(f"/api/v1/guru/{guru_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["nama"] == "Guru Test Satu"

    # 3. List Guru
    response = client.get("/api/v1/guru/", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # 4. Update Guru
    update_data = {"nama": "Guru Test Terupdate"}
    response = client.put(f"/api/v1/guru/{guru_id}", json=update_data, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["nama"] == "Guru Test Terupdate"

    # 5. Delete Guru
    response = client.delete(f"/api/v1/guru/{guru_id}", headers=admin_headers)
    assert response.status_code == 204

    # 6. Verify 404 on deleted teacher details
    response = client.get(f"/api/v1/guru/{guru_id}", headers=admin_headers)
    assert response.status_code == 404
