import json
from app.models.siswa import Siswa, StatusSPP
from app.core.database import SessionLocal

from app.services.attendance_rules import get_tk_month_weekdays

def get_program_target(prog_name: str, paket_jadwal: str = "") -> int:
    p_lower = (prog_name or "").lower().strip()
    if "tk" in p_lower:
        return get_tk_month_weekdays()
    if "fonem" in p_lower:
        return 12
    if "tahfidz" in p_lower:
        return 12
    if "inggris" in p_lower or "english" in p_lower:
        return 8
    if "sempoa" in p_lower:
        if "paket 2" in (paket_jadwal or "").lower() or "12" in (paket_jadwal or ""):
            return 12
        return 8
    return 8

def run():
    db = SessionLocal()
    try:
        all_siswa = db.query(Siswa).filter(Siswa.is_deleted == False).order_by(Siswa.id.asc()).all()
        print("=================================================================")
        print(f"   MEMAKSIMALKAN SELURUH KUOTA PERTEMUAN SISWA ({len(all_siswa)} SISWA)")
        print("=================================================================\n")

        updated_count = 0
        for s in all_siswa:
            old_sisa = s.sisa_pertemuan
            old_target = s.target_pertemuan
            old_status = str(s.status_spp)

            raw_progs = (s.kategori_program or "Sempoa SIP").split(",")
            progs = [p.strip() for p in raw_progs if p.strip()]

            # Parse existing kuota_program if any
            kuota_dict = {}
            if s.kuota_program:
                try:
                    kuota_dict = json.loads(s.kuota_program)
                    if not isinstance(kuota_dict, dict):
                        kuota_dict = {}
                except Exception:
                    kuota_dict = {}

            # Populate/maximize every program
            for p in progs:
                def_target = get_program_target(p, s.paket_jadwal)
                existing_entry = kuota_dict.get(p, {})
                t_val = existing_entry.get("target") or def_target
                if not isinstance(t_val, int) or t_val <= 0:
                    t_val = def_target
                
                # Full/maximum sessions for this program
                kuota_dict[p] = {
                    "sisa": t_val,
                    "target": t_val
                }

            # Determine overall student target and sisa
            is_tk_only = all("tk" in p.lower() for p in progs)
            non_tk_progs = [p for p in progs if "tk" not in p.lower()]

            if is_tk_only:
                tk_days = get_tk_month_weekdays()
                final_target = tk_days
                final_sisa = tk_days
            else:
                final_target = sum(kuota_dict[p]["target"] for p in non_tk_progs)
                final_sisa = sum(kuota_dict[p]["sisa"] for p in non_tk_progs)

            # Preserve if existing target is higher
            if old_target and old_target > final_target:
                final_target = old_target
                final_sisa = old_target

            # Apply updates
            s.target_pertemuan = final_target
            s.sisa_pertemuan = final_sisa
            s.kuota_program = json.dumps(kuota_dict)
            s.status_spp = StatusSPP.AKTIF

            updated_count += 1
            print(f"[UPDATED] ID {s.id} | {s.nama} ({s.kategori_program}):")
            print(f"   Sebelum: Sisa {old_sisa}/{old_target} | Status: {old_status}")
            print(f"   Sesudah: Sisa {final_sisa}/{final_target} (FULL MAKSIMAL) | Status: AKTIF")
            print(f"   Kuota JSON: {s.kuota_program}\n")

        db.commit()
        print("=================================================================")
        print(f"SUKSES: {updated_count} siswa berhasil dimaksimalkan pertemuannya!")
        print("Semua sisa pertemuan telah FULL dan status SPP AKTIF.")
        print("Admin/Direktur sekarang dapat mengedit sisa pertemuan siswa kapan saja.")
        print("=================================================================")
    except Exception as e:
        db.rollback()
        print(f"ERROR saat memproses data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run()
