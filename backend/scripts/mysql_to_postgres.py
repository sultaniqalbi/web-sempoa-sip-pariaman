import os
import re
import sys
from datetime import datetime
from sqlalchemy import create_engine, text

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings

def get_pg_url():
    url = settings.database_url
    if "db:5432" in url:
        url = url.replace("db:5432", "localhost:5433")
    return url

def parse_mysql_dump(dump_path):
    with open(dump_path, 'r', encoding='utf-8') as f:
        content = f.read()

    data_by_table = {}
    
    # Match INSERT INTO `table` VALUES (...), (...);
    insert_pattern = re.compile(r'INSERT INTO `([^`]+)` VALUES (.*?);', re.DOTALL)
    for match in insert_pattern.finditer(content):
        table_name = match.group(1)
        values_str = match.group(2).strip()
        
        rows = []
        
        # Use custom parser for sql tuple values
        def parse_sql_values(row_str):
            vals = []
            curr = []
            in_quotes = False
            quote_char = None
            escaped = False
            
            for char in row_str:
                if escaped:
                    curr.append(char)
                    escaped = False
                elif char == '\\':
                    escaped = True
                elif char in ("'", '"'):
                    if not in_quotes:
                        in_quotes = True
                        quote_char = char
                    elif quote_char == char:
                        in_quotes = False
                        quote_char = None
                    else:
                        curr.append(char)
                elif char == ',' and not in_quotes:
                    v = "".join(curr).strip()
                    if v == 'NULL':
                        vals.append(None)
                    elif (v.startswith("'") and v.endswith("'")) or (v.startswith('"') and v.endswith('"')):
                        vals.append(v[1:-1])
                    else:
                        try:
                            vals.append(int(v))
                        except ValueError:
                            try:
                                vals.append(float(v))
                            except ValueError:
                                vals.append(v)
                    curr = []
                else:
                    curr.append(char)
            
            if curr:
                v = "".join(curr).strip()
                if v == 'NULL':
                    vals.append(None)
                elif (v.startswith("'") and v.endswith("'")) or (v.startswith('"') and v.endswith('"')):
                    vals.append(v[1:-1])
                else:
                    try:
                        vals.append(int(v))
                    except ValueError:
                        try:
                            vals.append(float(v))
                        except ValueError:
                            vals.append(v)
            return vals

        # Split tuples accurately
        in_str = False
        str_char = None
        bracket_level = 0
        current_tuple = []
        
        for char in values_str:
            if char in ("'", '"') and not str_char:
                str_char = char
                in_str = True
                current_tuple.append(char)
            elif char == str_char and in_str:
                str_char = None
                in_str = False
                current_tuple.append(char)
            elif char == '(' and not in_str:
                if bracket_level == 0:
                    current_tuple = []
                else:
                    current_tuple.append(char)
                bracket_level += 1
            elif char == ')' and not in_str:
                bracket_level -= 1
                if bracket_level == 0:
                    t_str = "".join(current_tuple)
                    rows.append(parse_sql_values(t_str))
                else:
                    current_tuple.append(char)
            else:
                if bracket_level > 0:
                    current_tuple.append(char)
                    
        data_by_table[table_name] = rows

    return data_by_table

def migrate():
    pg_url = get_pg_url()
    print(f"Connecting to PostgreSQL at {pg_url}...")
    engine = create_engine(pg_url)
    
    dump_path = r"C:\Users\pf3sg\backups\sempoa_sip_legacy.sql"
    if not os.path.exists(dump_path):
        print(f"ERROR: MySQL dump file not found at {dump_path}")
        sys.exit(1)

    print(f"Parsing MySQL dump file: {dump_path}...")
    table_data = parse_mysql_dump(dump_path)

    with engine.begin() as conn:
        tables_in_order = [
            "users",
            "guru",
            "siswa",
            "absensi_log",
            "jadwal",
            "keuangan",
            "pembayaran_periode",
            "bukti_transfer",
            "galeri",
            "pendaftaran_baru"
        ]

        summary = {}

        for table in tables_in_order:
            rows = table_data.get(table, [])
            count = len(rows)
            print(f"Importing table '{table}': {count} rows...")

            if table == "users":
                for r in rows:
                    conn.execute(
                        text("""
                            INSERT INTO users (id, email, password, role, nama, bio, foto_profil, uid_terhubung, created_at)
                            VALUES (:id, :email, :password, CAST(:role AS user_role_enum), :nama, :bio, :foto_profil, :uid_terhubung, :created_at)
                            ON CONFLICT (id) DO NOTHING;
                        """),
                        {
                            "id": r[0],
                            "email": r[1],
                            "password": r[2],
                            "role": r[3],
                            "nama": r[4],
                            "bio": r[5] if len(r) > 5 else None,
                            "foto_profil": r[6] if len(r) > 6 else None,
                            "uid_terhubung": r[7] if len(r) > 7 else None,
                            "created_at": r[8] if len(r) > 8 else datetime.now()
                        }
                    )
            elif table == "guru":
                for r in rows:
                    conn.execute(
                        text("""
                            INSERT INTO guru (id, uid, nama, kategori_program, hari_wajib, target_kehadiran, created_at, bio, foto_profil)
                            VALUES (:id, :uid, :nama, :kategori_program, :hari_wajib, :target_kehadiran, :created_at, :bio, :foto_profil)
                            ON CONFLICT (id) DO NOTHING;
                        """),
                        {
                            "id": r[0],
                            "uid": r[1],
                            "nama": r[2],
                            "kategori_program": r[3],
                            "hari_wajib": r[4],
                            "target_kehadiran": r[5],
                            "created_at": r[6] if len(r) > 6 else datetime.now(),
                            "bio": r[7] if len(r) > 7 else None,
                            "foto_profil": r[8] if len(r) > 8 else None
                        }
                    )
            elif table == "galeri":
                for r in rows:
                    conn.execute(
                        text("""
                            INSERT INTO galeri (id, judul, file_path, created_at)
                            VALUES (:id, :judul, :file_path, :created_at)
                            ON CONFLICT (id) DO NOTHING;
                        """),
                        {
                            "id": r[0],
                            "judul": r[1],
                            "file_path": r[2],
                            "created_at": r[3] if len(r) > 3 else datetime.now()
                        }
                    )

            # Synchronize PostgreSQL primary key sequences
            res_seq = conn.execute(text(f"""
                SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1), max(id) IS NOT NULL) FROM {table};
            """)).scalar()
            
            actual_count = conn.execute(text(f"SELECT COUNT(*) FROM {table};")).scalar()
            summary[table] = actual_count
            print(f"Table '{table}' row count in PostgreSQL: {actual_count}")

        print("\n=== MIGRATION SUMMARY ===")
        for tbl, cnt in summary.items():
            print(f"  - {tbl}: {cnt} rows")
        print("Migration executed successfully!")

if __name__ == "__main__":
    migrate()
