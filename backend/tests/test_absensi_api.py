import pytest

def test_read_absensi_list_unauthorized(client):
    response = client.get("/api/v1/absensi")
    assert response.status_code == 401

def test_create_absensi_unauthorized(client):
    absensi_data = {
        "uid": "AB-TEST-001",
        "waktu": "2026-08-11T12:00:00",
        "mode": "ONLINE",
        "status": "HADIR"
    }
    response = client.post("/api/v1/absensi/", json=absensi_data)
    assert response.status_code == 401

def test_absensi_api_lifecycle_admin(client, admin_headers):
    # 1. Create Absensi
    absensi_data = {
        "uid": "AB-TEST-001",
        "waktu": "2026-08-11T12:00:00",
        "mode": "ONLINE",
        "status": "HADIR"
    }
    response = client.post("/api/v1/absensi/", json=absensi_data, headers=admin_headers)
    assert response.status_code == 201
    created_log = response.json()
    assert created_log["uid"] == "AB-TEST-001"
    assert created_log["status"] == "HADIR"

    # 2. Get Absensi List
    response = client.get("/api/v1/absensi/", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1
