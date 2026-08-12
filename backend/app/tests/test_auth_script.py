import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.main import app

def test_full_authentication_flow():
    client = TestClient(app)
    print("=== STARTING AUTHENTICATION & SECURITY TESTS ===")

    # 1. Test Login (Valid Admin with Case-Insensitive Check)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "adminsip@sempoasippariaman.com", "password": "Z6@s#Ax7"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    admin_tokens = response.json()
    assert "access_token" in admin_tokens
    assert "refresh_token" in admin_tokens
    assert admin_tokens["role"] == "admin"

    # 2. Test Login (Valid Owner with Case-Insensitive Check)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ownersip@sempoasippariaman.com", "password": "8W&x#I2m"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    owner_tokens = response.json()
    assert owner_tokens["role"] == "owner"

    # 3. Test Login (Invalid Credentials)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "AdminSip@sempoasippariaman.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    # 4. Test Token Refresh
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": admin_tokens["refresh_token"]}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    refreshed_tokens = response.json()
    assert "access_token" in refreshed_tokens

    # 5. Test Protected Route without Token
    response = client.get("/api/v1/test-protected")
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    # 6. Test Protected Route with Valid Token
    headers = {"Authorization": f"Bearer {admin_tokens['access_token']}"}
    response = client.get("/api/v1/test-protected", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.json()["user"]["email"].lower() == "adminsip@sempoasippariaman.com"

    # 7. Test Role Restriction (Admin trying to access Owner-only route)
    response = client.get("/api/v1/test-owner-only", headers=headers)
    assert response.status_code == 403, f"Expected 403, got {response.status_code}"

    # 8. Test Role Access (Owner accessing Owner-only route)
    owner_headers = {"Authorization": f"Bearer {owner_tokens['access_token']}"}
    response = client.get("/api/v1/test-owner-only", headers=owner_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    # 9. Test Owner-Exclusive Endpoint (Owner accessing /api/v1/owner/pertumbuhan)
    response = client.get("/api/v1/owner/pertumbuhan", headers=owner_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    # 10. Test Owner-Exclusive Route Blocked for Admin
    response = client.get("/api/v1/owner/pertumbuhan", headers=headers)
    assert response.status_code == 403, f"Expected 403, got {response.status_code}"

    print("=== ALL AUTHENTICATION & SECURITY TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_full_authentication_flow()
