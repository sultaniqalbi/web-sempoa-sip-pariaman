import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app

client = TestClient(app)

def run_tests():
    print("=== STARTING AUTHENTICATION & SECURITY TESTS ===")

    # 1. Test Login (Valid Admin)
    print("\n1. Testing Login with valid Admin credentials...")
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sempoasippariaman.com", "password": "BXZ!@jkl"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    admin_tokens = response.json()
    assert "access_token" in admin_tokens
    assert "refresh_token" in admin_tokens
    assert admin_tokens["role"] == "admin"
    print("✓ Valid Admin login success!")

    # 2. Test Login (Valid Owner)
    print("\n2. Testing Login with valid Owner credentials...")
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@sempoasippariaman.com", "password": "QWE#$vbn"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    owner_tokens = response.json()
    assert owner_tokens["role"] == "owner"
    print("✓ Valid Owner login success!")

    # 3. Test Login (Invalid Credentials)
    print("\n3. Testing Login with invalid credentials...")
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sempoasippariaman.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("✓ Invalid login correctly rejected with 401 Unauthorized!")

    # 4. Test Token Refresh
    print("\n4. Testing Token Refresh endpoint...")
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": admin_tokens["refresh_token"]}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    refreshed_tokens = response.json()
    assert "access_token" in refreshed_tokens
    print("✓ Token refresh success!")

    # 5. Test Protected Route without Token
    print("\n5. Testing protected route access without token...")
    response = client.get("/api/v1/test-protected")
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("✓ Protected route access without token correctly rejected with 401!")

    # 6. Test Protected Route with Valid Token
    print("\n6. Testing protected route access with valid Admin token...")
    headers = {"Authorization": f"Bearer {admin_tokens['access_token']}"}
    response = client.get("/api/v1/test-protected", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.json()["user"]["email"] == "admin@sempoasippariaman.com"
    print("✓ Protected route access with valid token success!")

    # 7. Test Role Restriction (Admin trying to access Owner-only route)
    print("\n7. Testing role restriction (Admin trying to access Owner-only route)...")
    headers = {"Authorization": f"Bearer {admin_tokens['access_token']}"}
    response = client.get("/api/v1/test-owner-only", headers=headers)
    assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    print("✓ Admin trying to access Owner route correctly rejected with 403 Forbidden!")

    # 8. Test Role Access (Owner accessing Owner-only route)
    print("\n8. Testing role access (Owner accessing Owner-only route)...")
    headers = {"Authorization": f"Bearer {owner_tokens['access_token']}"}
    response = client.get("/api/v1/test-owner-only", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    print("✓ Owner accessing Owner route success!")

    # 9. Test Rate Limiter (5 failed attempts trigger 429)
    print("\n9. Testing rate limiter (5 failed attempts trigger 429)...")
    # Make 5 failed attempts (first attempt for this specific email)
    for i in range(5):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "limit-test@test.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401 on attempt {i+2}, got {response.status_code}"

    # The 6th attempt should trigger 429
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "limit-test@test.com", "password": "wrongpassword"}
    )
    assert response.status_code == 429, f"Expected 429 on attempt 6, got {response.status_code}"
    print("✓ Rate limiter triggered correctly! 6th attempt rejected with 429 Too Many Requests!")

    print("\n=== ALL AUTHENTICATION & SECURITY TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
