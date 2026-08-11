# Troubleshooting Guide

Standardized resolutions for common operational issues in the Sempoa SIP TC Pariaman application.

---

## 1. ESP32 Offline or Response Failures
### Symptoms:
- ESP32 green LED fails to blink upon card tap.
- Device reports `GURU_NOT_FOUND` or returns error messages in serial logs.

### Resolutions:
1. **Check WiFi Connection**: Ensure ESP32 is connected to the router. Power-cycle the hardware module to retrigger DHCP handshakes.
2. **Key Match Verification**: Ensure the `X-API-Key` configured in ESP32 firmware code matches `ESP32_API_KEY` in backend `.env` files.
3. **Verify Domain/IP**: Ensure the domain pointer is resolving correctly on port `80` or `8000`.

---

## 2. JWT Expired & Login Loop
### Symptoms:
- Pages continuously redirect users to the `/login` page.
- Browser console reports constant 401 exceptions on fetch query hooks.

### Resolutions:
1. **Refresh Token Expiry**: If a user is idle for more than 7 days, the refresh token expires. Clean local cache and re-authenticate:
   ```javascript
   localStorage.clear();
   window.location.href = '/login';
   ```
2. **Server Time Sync**: Ensure the VPS clock is synchronized (using NTP) to prevent token validation failures.

---

## 3. Database Sequence Insertion Errors (duplicate key value violates unique constraint)
### Symptoms:
- Server returns HTTP 500 when creating a student or teacher profile.
- SQL error log shows primary key constraint violations on serial IDs.

### Resolutions:
Reset the primary key sequence to align with the max ID of the tables:
```sql
SELECT setval('siswa_id_seq', (SELECT MAX(id) FROM siswa));
SELECT setval('guru_id_seq', (SELECT MAX(id) FROM guru));
```
