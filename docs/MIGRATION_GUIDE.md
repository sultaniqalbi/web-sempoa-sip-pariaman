# Database Migration Guide: Legacy MySQL → PostgreSQL

Guide to migrating the legacy database to PostgreSQL.

---

## 1. Schema Generation and Mapping
Database schemas are managed using Alembic migrations in `backend/alembic/`.
1. Run all database migration versions to structure the fresh PostgreSQL database:
   ```bash
   cd backend
   alembic upgrade head
   ```
2. Verify that all 10 tables are mapped correctly inside PostgreSQL.

---

## 2. Legacy MySQL Data Importing
We use the python import utility script at `backend/scripts/mysql_to_postgres.py` to transfer data from a MySQL database dump (`sempoa_sip_legacy.sql`) into the live PostgreSQL instance:
1. Ensure your local virtual environment is active:
   ```bash
   .venv\Scripts\activate # On Windows PowerShell
   ```
2. Run the migration script:
   ```bash
   python backend/scripts/mysql_to_postgres.py
   ```
   *The script executes row-by-row insertions, preserving primary keys and bcrypt password hashes, and resets table auto-increment sequences (setval) to prevent sequence insertion locks.*

---

## 3. Post-Migration Verification
Execute the following verification script to check row counts and integrity:
```bash
python backend/scripts/verify_migration.py
```
Expected counts:
- `users`: 11 rows
- `guru`: 4 rows
- `siswa`: 12 rows
- `absensi_log`: Verify all RFID tap events are mapped correctly.
