import os
import sys
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.core.database import get_database_url

client = TestClient(app)

def cleanup_test_data():
    engine = create_engine(get_database_url())
    with engine.begin() as conn:
        # Delete test absensi logs
        conn.execute(text("DELETE FROM absensi_log WHERE uid = '65 44 02 07'"))
        # Delete test unregistered pendaftaran_baru scans
        conn.execute(text("DELETE FROM pendaftaran_baru WHERE nama_anak = 'UNREGISTERED_FF FF FF FF'"))

def run_tests():
    print("=== STARTING HARDWARE (ESP32) CONTRACT TESTS ===")
    cleanup_test_data()

    api_key = "SempoaPariaman_ESP32_SecureKey_2026!"

    # 1. Test Valid Tap (First scan of the day)
    print("\n1. Testing valid tap (First scan of the day)...")
    response = client.post(
        "/api/absensi",
        headers={"X-API-Key": api_key},
        data={"uid": "65 44 02 07", "waktu": "2026-08-11 15:30:00", "mode": "ONLINE"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.text == "OK|budi", f"Expected 'OK|budi', got '{response.text}'"
    print("✓ Valid tap success!")

    # 2. Test Second Tap Same Day (Idempotency)
    print("\n2. Testing second tap on the same day...")
    response = client.post(
        "/api/absensi",
        headers={"X-API-Key": api_key},
        data={"uid": "65 44 02 07", "waktu": "2026-08-11 15:32:00", "mode": "ONLINE"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.text == "OK|budi|SUDAH_TAP", f"Expected 'OK|budi|SUDAH_TAP', got '{response.text}'"
    print("✓ Idempotency double-tap check success!")

    # 3. Test Unregistered Card Scan
    print("\n3. Testing unregistered card tap...")
    response = client.post(
        "/api/absensi",
        headers={"X-API-Key": api_key},
        data={"uid": "FF FF FF FF", "waktu": "2026-08-11 15:35:00", "mode": "ONLINE"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.text == "GURU_NOT_FOUND", f"Expected 'GURU_NOT_FOUND', got '{response.text}'"
    
    # Check last_tap.json contents
    last_tap_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../last_tap.json"))
    assert os.path.exists(last_tap_path), "last_tap.json not found!"
    with open(last_tap_path, "r", encoding="utf-8") as f:
        tap_data = json.load(f)
    assert tap_data["uid"] == "FF FF FF FF"
    assert tap_data["status"] == "UNREGISTERED"
    print("✓ Unregistered card tap handled and logged in last_tap.json!")

    # Verify database record in pendaftaran_baru
    engine = create_engine(get_database_url())
    with engine.connect() as conn:
        row = conn.execute(text("SELECT id, nama_anak, catatan FROM pendaftaran_baru WHERE nama_anak = 'UNREGISTERED_FF FF FF FF'")).first()
        assert row is not None
        assert "Unregistered card tapped" in row.catatan
    print("✓ Unregistered card details auto-saved to pendaftaran_baru table in PostgreSQL!")

    # 4. Test Bad API Key
    print("\n4. Testing POST /api/absensi with bad API key...")
    response = client.post(
        "/api/absensi",
        headers={"X-API-Key": "wrong_key"},
        data={"uid": "65 44 02 07", "waktu": "2026-08-11 15:30:00", "mode": "ONLINE"}
    )
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    assert response.text == "UNAUTHORIZED", f"Expected 'UNAUTHORIZED', got '{response.text}'"
    print("✓ Invalid key rejection success!")

    # 5. Test Missing API Key
    print("\n5. Testing POST /api/absensi with missing API key...")
    response = client.post(
        "/api/absensi",
        data={"uid": "65 44 02 07", "waktu": "2026-08-11 15:30:00", "mode": "ONLINE"}
    )
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("✓ Missing key rejection success!")

    # 6. Test GET /api/ping
    print("\n6. Testing GET /api/ping with valid key...")
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
    run_tests()
