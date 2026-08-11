# API Endpoints & Reference Manual

API specifications for the Sempoa SIP TC Pariaman application.

---

## 1. Authentication Endpoints

### POST `/api/v1/auth/login`
- **Description**: Authenticate user using email and password credentials.
- **Body Request (JSON)**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword"
  }
  }
  ```
- **Response (JSON)**:
  ```json
  {
    "access_token": "jwt_access_token_string",
    "refresh_token": "jwt_refresh_token_string",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "admin",
      "nama": "Jane Doe"
    }
  }
  ```

### POST `/api/v1/auth/refresh`
- **Description**: Generate a new access token using a valid refresh token.
- **Body Request (JSON)**:
  ```json
  {
    "refresh_token": "jwt_refresh_token_string"
  }
  ```

---

## 2. Hardware Endpoints (ESP32 Integration)

### POST `/api/absensi`
- **Description**: Synchronizes RFID card taps from hardware.
- **Headers**:
  - `X-API-Key`: `SempoaPariaman_ESP32_SecureKey_2026!`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body Fields**:
  - `uid`: Card ID (e.g. `23AB76CD`)
  - `waktu`: `YYYY-MM-DD HH:MM:SS`
  - `mode`: `ONLINE` or `OFFLINE`
- **Response (PlainText)**:
  - Success: `OK|<Nama>` or `OK|<Nama>|SUDAH_TAP`
  - Errors: `GURU_NOT_FOUND`, `ERROR_UID_KOSONG`, `ERROR_DB`

---

## 3. Core CRUD Endpoints (Protected JWT)

### Students (`/api/v1/siswa`)
- `GET /api/v1/siswa/` — List all registered students (Admin/Owner only).
- `POST /api/v1/siswa/` — Add a new student record.
- `GET /api/v1/siswa/{id}` — Get student profile details.
- `PUT /api/v1/siswa/{id}` — Update student information.
- `DELETE /api/v1/siswa/{id}` — Soft delete a student profile.

### Teachers (`/api/v1/guru`)
- `GET /api/v1/guru/` — List all teachers.
- `POST /api/v1/guru/` — Add a new teacher.

### Attendance (`/api/v1/absensi`)
- `GET /api/v1/absensi/` — List attendance logs.
- `POST /api/v1/absensi/` — Record student attendance (Hadir/Alfa/Izin).
  - *Note: Marking student as HADIR automatically decrements sisa_pertemuan by 1. When quota hits 0, updates student status to EXPIRED and appends billing.*
