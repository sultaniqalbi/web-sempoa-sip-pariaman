# Performance, Architecture & Hardening Optimizations — Sempoa SIP TC Pariaman

This document outlines high-value engineering optimizations separated from bug fixes, ranked by value-per-effort.

---

## Ranked Optimization Opportunities

| Rank | Area | Title | Expected Gain | Cost / Effort | Value / Effort |
|---|---|---|---|---|---|
| **1** | **Database** | Add Composite Index on `absensi_log(uid, waktu)` | Eliminates full table scans on RFID duplicate check and attendance queries | XS | **Highest** |
| **2** | **Frontend** | Code Splitting & Dynamic Imports for Recharts | Reduces initial JS bundle size by ~180KB for faster mobile load times | S | **High** |
| **3** | **Network** | Redis-Backed Connection State for WebSocket Heartbeats | Prevents redundant database query checks on client reconnects | S | **High** |
| **4** | **Database** | Batch Student & Teacher Mapping in `absensi.py` | Eliminates N+1 query pattern in attendance list serializer | S | **High** |
| **5** | **Hardening** | Implement HTTP Request Body Size Caps in FastAPI Middleware | Protects against memory exhaustion from oversized payloads | XS | **High** |
| **6** | **Architecture** | Centralize Multi-Program Rules into Backend Constants Module | Eliminates duplicated program pricing and quota rules across TS and Python | M | **Medium** |
| **7** | **Caching** | Redis Caching for `/portal/dashboard` Metric Aggregates | Reduces database read load on admin dashboard auto-refresh intervals | M | **Medium** |

---

## 1. Database Indexing: `absensi_log(uid, waktu)`

### Current State
`absensi_log` indexes `uid` individually, but queries frequently filter by `uid` and a date range:
```sql
SELECT * FROM absensi_log WHERE uid = '...' AND waktu >= '...' ORDER BY waktu DESC;
```

### Proposed Change
Add a composite B-Tree index via Alembic migration:
```python
op.create_index('idx_absensi_uid_waktu', 'absensi_log', ['uid', 'waktu'])
```

### Gain
- Execution time drops from O(N) sequential scan to O(log N) index scan.
- Immediate latency reduction on ESP32 card tap response (< 50ms).

---

## 2. Frontend Bundle Size: Lazy Loading `recharts`

### Current State
`frontend/src/pages/owner-only/KeuanganPage.tsx` and `PertumbuhanPage.tsx` import `recharts` statically:
```typescript
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
```
Since `recharts` is only viewed by owner/director accounts, loading it on the initial public/parent bundle wastes bandwidth.

### Proposed Change
Wrap chart components in `React.lazy()` or load the page dynamically using existing `React.lazy` routing in `App.tsx`.

### Gain
- Shrinks initial bundle size by ~180KB gzipped.
- Improves Lighthouse performance score and First Contentful Paint (FCP) on 4G networks.

---

## 3. Database Query Optimization: Batch Serializer in `absensi.py`

### Current State
In `read_absensi_list` (`absensi.py:124-170`), the endpoint loads all gurus and students into memory maps:
```python
gurus = db.query(Guru).filter(Guru.is_deleted == False).all()
siswas = db.query(Siswa).filter(Siswa.is_deleted == False).all()
```
As the student directory grows to hundreds or thousands of records, fetching all active students on every attendance page view consumes excess memory and CPU.

### Proposed Change
Extract only the unique UIDs present in the current pagination slice (`logs`):
```python
uids_in_page = {l.uid for l in logs if l.uid}
relevant_gurus = db.query(Guru).filter(Guru.uid.in_(uids_in_page)).all()
relevant_siswas = db.query(Siswa).filter(Siswa.uid.in_(uids_in_page)).all()
```

### Gain
- Query memory footprint bounded to page size (`limit=50`) instead of entire database population.
- Prevents degradation as school scales to 1,000+ students.

---

## 4. Security Hardening: Strict CSP & Nginx Rate Limiting per Route

### Current State
`nginx.conf` applies a global configuration for `/api` with a single rate limiter.

### Proposed Change
1. Add dedicated Nginx `limit_req_zone` for `/api/v1/auth/login` (5 requests/min per IP) to absorb brute-force attacks before hitting Python processes.
2. Maintain hardware whitelist zone for `/api/absensi` guaranteeing zero dropped taps during high-concurrency morning arrivals.

### Gain
- Eliminates Python GIL saturation during denial-of-service attempts.
- Guarantees high availability for physical RFID readers.

---

## 5. Architectural Cleanliness: Single Source of Truth for Program Presets

### Current State
Program definitions, package options (e.g. 8 vs 12 meetings, 60 vs 90 min), and fees (Rp 350.000 vs Rp 200.000) are hardcoded independently in:
- `backend/app/api/v1/endpoints/siswa.py`
- `backend/app/api/v1/endpoints/pembayaran.py`
- `frontend/src/pages/portal/SiswaPage.tsx`
- `frontend/src/pages/portal/BukuPage.tsx`

### Proposed Change
Expose a single endpoint `GET /api/v1/programs/config` serving the authoritative program tiers, quotas, and pricing. Frontend components consume this configuration dynamically.

### Gain
- Future price adjustments or new program additions (e.g. Robotika, Coding Anak) require updating one configuration file rather than auditing 6 separate source files.
