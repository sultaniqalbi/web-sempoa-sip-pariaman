# Remediation Plan — Sempoa SIP TC Pariaman

This document provides the ordered, dependency-aware implementation plan for resolving all findings identified in the audit.

---

## Batch 1: Deploy Blockers (P0 & P1)

These 9 findings represent active data integrity risks, critical authorization bugs, crashes, or security vulnerabilities that MUST be resolved prior to any production deployment.

### Execution Order & Dependencies

1. **Fix `[P0-003]` — Scheduler Crash Fix**
   - **Reason:** Lowest complexity, zero architectural dependencies, stops the background daemon from throwing continuous error logs.
   - **File:** `backend/app/services/scheduler.py`
   - **Change:** Replace `(Siswa.status_spp != StatusSPP.LUNAS)` with `(Siswa.status_spp == StatusSPP.EXPIRED)`.
   - **Effort:** XS | **Regression Risk:** None.
   - **What to test:** Run `python -c "from app.services.scheduler import check_and_send_spp_reminders; check_and_send_spp_reminders()"`.

2. **Fix `[P1-006]` — Define `pwd_context` in Security Module**
   - **Reason:** Foundational security utility required by user management and authentication.
   - **File:** `backend/app/core/security.py`
   - **Change:** Instantiate `pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")`.
   - **Effort:** XS | **Regression Risk:** Low.
   - **What to test:** Test password hashing and verification with both standard and edge-case passwords.

3. **Fix `[P1-008]` — Health Check Endpoint JSONResponse**
   - **Reason:** Ensures uptime monitors and container liveness probes receive accurate HTTP status codes.
   - **File:** `backend/app/main.py`
   - **Change:** Return `JSONResponse(status_code=500, content={"status": "degraded", ...})` instead of a raw tuple.
   - **Effort:** XS | **Regression Risk:** None.
   - **What to test:** Send HTTP GET request to `/health` with database offline. Verify HTTP 500 response status.

4. **Fix `[P0-001]` & `[P1-005]` — Eliminate IDOR in Student Resolver & Receipt Endpoints**
   - **Reason:** Core security fix preventing unauthorized parent access to arbitrary student profiles and receipts.
   - **Files:**
     - `backend/app/api/v1/endpoints/siswa.py`
     - `backend/app/api/v1/endpoints/bukti_transfer.py`
   - **Change:**
     - In `siswa.py:101-114` and `bukti_transfer.py:59-65`, remove the fallback query to the first student in the database. Return HTTP 404 when no student matches.
     - In `bukti_transfer.py:208-245`, add an authorization gate verifying `current_user.role in ['admin', 'owner']` or `current_user.uid_terhubung == str(siswa.id)`.
   - **Effort:** S | **Regression Risk:** Low.
   - **What to test:** Login as an unlinked parent account and verify `/api/v1/siswa/my-child` returns 404 without corrupting `uid_terhubung`. Attempt to access another student's kwitansi endpoint and confirm HTTP 403.

5. **Fix `[P0-004]` — Standardize `periode_bulan` to ISO `"%Y-%m"`**
   - **Reason:** Solves data synchronization between billing receipts and financial reporting queries.
   - **File:** `backend/app/api/v1/endpoints/bukti_transfer.py`
   - **Change:** Change `datetime.now().strftime("%B %Y")` to `datetime.now().strftime("%Y-%m")` across all billing creation handlers.
   - **Effort:** S | **Regression Risk:** Medium (requires running an idempotent database query to normalize existing `"Bulan YYYY"` values to `"YYYY-MM"`).
   - **What to test:** Upload receipt for a new month and verify the payment is immediately recognized in `/api/v1/owner/keuangan`.

6. **Fix `[P1-007]` — Connect Frontend Logout to Server-Side Token Blacklist**
   - **Reason:** Complete the session revocation loop.
   - **File:** `frontend/src/features/auth/AuthContext.tsx`
   - **Change:** In `logout()`, call `await apiClient.post('/auth/logout', { refresh_token })` inside a try-finally block before clearing `localStorage`.
   - **Effort:** XS | **Regression Risk:** Low.
   - **What to test:** Log in, log out, and verify that the previous access token is rejected on subsequent API requests.

7. **Fix `[P0-002]` — Eliminate Plaintext Passwords (`plain_password`)**
   - **Reason:** Remove sensitive credentials from persistent storage.
   - **Files:**
     - `backend/app/models/users.py`
     - `backend/app/main.py`
     - `backend/app/api/v1/endpoints/guru.py`
     - `backend/app/api/v1/endpoints/siswa.py`
   - **Change:** Drop `plain_password` from `User` model. Return the generated password strictly in the one-time JSON response during account provisioning so the frontend can populate the WhatsApp modal.
   - **Effort:** M | **Regression Risk:** Medium (requires verifying that the admin UI can still trigger WhatsApp message dispatch with newly generated credentials).
   - **What to test:** Create a new teacher and new student; verify WhatsApp credential dialog displays the generated password and that database stores no plaintext copy.

8. **Fix `[P1-009]` — Secure Hardcoded VAPID Secrets & ESP32 Defaults**
   - **Reason:** Prevents unauthorized push spoofing.
   - **Files:**
     - `backend/app/core/config.py`
     - `hardware/Absensi_ESP32_Deploy/Absensi_ESP32_Deploy.ino`
   - **Change:** Remove committed default VAPID private key from `config.py`. Enforce production validation requiring environment-provided values.
   - **Effort:** S | **Regression Risk:** Low.
   - **What to test:** Verify push notification service initializes properly when environment variables are set.

---

## Batch 2: Medium Priority (P2)

These 4 findings enhance cross-database compatibility, eliminate frontend form bugs, and ensure proper ledger tracking.

1. **`[P2-010]` — Fix Deep Link in Push Notifications**
   - **Files:** `backend/app/services/scheduler.py`, `backend/app/services/push_notification.py`
   - **Change:** Update fallback URL from `/ortu/keuangan` to `/ortu/pembayaran`.
   - **Effort:** XS | **Risk:** None.

2. **`[P2-011]` — Database Agnostic Duplicate Detection for Hardware Taps**
   - **File:** `backend/app/api/v1/endpoints/hardware.py`
   - **Change:** Replace `func.timezone` with explicit UTC/WIB datetime range (`waktu >= today_start and waktu <= today_end`).
   - **Effort:** S | **Risk:** None.

3. **`[P2-012]` — Refactor Axios Interceptor Empty String Sanitizer**
   - **File:** `frontend/src/features/api/apiClient.ts`
   - **Change:** Restrict empty-string-to-null conversion so required string fields with empty inputs are preserved as `""`.
   - **Effort:** S | **Risk:** Medium.

4. **`[P2-013]` — Insert Ledger Entry into `keuangan` upon Payment Approval**
   - **File:** `backend/app/crud/bukti_transfer.py`
   - **Change:** Insert `Keuangan` record when `approve_bukti_transfer` executes.
   - **Effort:** S | **Risk:** Low.

---

## Batch 3: Low Priority (P3)

These 2 findings address code hygiene and forward compatibility.

1. **`[P3-014]` — Modernize `datetime.utcnow()` to `datetime.now(timezone.utc)`**
   - **Files:** `backend/app/core/security.py`, `backend/app/api/v1/endpoints/bukti_transfer.py`
   - **Effort:** XS | **Risk:** None.

2. **`[P3-015]` — Clean Up Scratch Scripts**
   - **Files:** `backend/cleanup_dummy.py`, `backend/scratch/`
   - **Effort:** XS | **Risk:** None.

---

## Code Conflicts & Co-Dependencies

- **`[P0-001]` and `[P1-005]`** both touch `bukti_transfer.py` and must be executed together to avoid duplicate edits to `resolve_student_for_parent`.
- **`[P0-002]`** touches both `siswa.py` and `guru.py` alongside the `User` database model; migration scripts must run in synchronization with backend updates.

## Findings Deferred from Immediate Remediation

- **None.** All findings are actionable and scoped. No findings are deferred.
