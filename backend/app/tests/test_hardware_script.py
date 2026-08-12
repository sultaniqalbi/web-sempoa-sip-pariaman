import os
import sys
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.main import app
from app.core.database import get_database_url

def cleanup_test_data():
    engine = create_engine(get_database_url())
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM absensi_log WHERE uid IN ('65 44 02 07', 'FF FF FF FF')"))
        conn.execute(text("DELETE FROM pendaftaran_baru WHERE nama_anak LIKE 'UNREGISTERED_%'"))
        conn.execute(text("DELETE FROM guru WHERE uid = '65 44 02 07'"))

def setup_test_teacher():
    engine = create_engine(get_database_url())
    with engine.begin() as conn:
        # Check if test teacher exists
        res = conn.execute(text("SELECT id FROM guru WHERE uid = '65 44 02 07'")).first()
        if not res:
            conn.execute(text(
                "INSERT INTO guru (uid, nama, kategori_program, hari_wajib, target_kehadiran, whatsapp_guru) "
                "VALUES ('65 44 02 07', 'Budi Santoso', 'Junior 1', 'SENIN', 16, '628123456789')"
            ))

def test_hardware_contract_flow():
    client = TestClient(app)
    print("=== STARTING HARDWARE (ESP32) CONTRACT TESTS ===")
    cleanup_test_data()
    setup_test_teacher()

    api_key = "SempoaPariaman_ESP32_SecureKey_2026!"

    # 1. Test Valid Tap (First scan of the day)
    print("\n1. Testing valid tap (First scan of the day)...")
    response = client.post(
        "/api/absensi",
        headers={"X-API-Key": api_key},
        data={"uid": "65 44 02 07", "waktu": "2026-08-11 15:30:00", "mode": "ONLINE"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert "OK" in response.text, f"Expected 'OK', got '{response.text}'"
    print(f"✓ Valid tap success: {response.text}")

    # 2. Test Unregistered Card Scan
    print("\n2. Testing unregistered card tap...")
    response = client.post(
        "/api/absensi",
        headers={"X-API-Key": api_key},
        data={"uid": "FF FF FF FF", "waktu": "2026-08-11 15:35:00", "mode": "ONLINE"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.text == "GURU_NOT_FOUND", f"Expected 'GURU_NOT_FOUND', got '{response.text}'"
    print("✓ Unregistered card tap handled!")

    # 3. Test Bad API Key
    print("\n3. Testing POST /api/absensi with bad API key...")
    response = client.post(
        "/api/absensi",
        headers={"X-API-Key": "wrong_key"},
        data={"uid": "65 44 02 07", "waktu": "2026-08-11 15:30:00", "mode": "ONLINE"}
    )
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    assert response.text == "UNAUTHORIZED", f"Expected 'UNAUTHORIZED', got '{response.text}'"
    print("✓ Invalid key rejection success!")

    # 4. Test Missing API Key
    print("\n4. Testing POST /api/absensi with missing API key...")
    response = client.post(
        "/api/absensi",
        data={"uid": "65 44 02 07", "waktu": "2026-08-11 15:30:00", "mode": "ONLINE"}
    )
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("✓ Missing key rejection success!")

    # 5. Test GET /api/ping
    print("\n5. Testing GET /api/ping with valid key...")
    response = client.get(
        "/api/ping",
        headers={"X-API-Key": api_key}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.text in ["OK", "RESET", "FULL_RESET"]
    print(f"✓ Ping success, got: '{response.text}'")

    print("\n=== ALL HARDWARE CONTRACT TESTS PASSED SUCCESSFULLY ===")
    cleanup_test_data()

if __name__ == "__main__":
    test_hardware_contract_flow()
