"""
Authoritative Attendance & Lateness Rules for Sempoa SIP TC Pariaman.

Aturan Keterlambatan Guru:
1. Owner / Direktur (Zulhemawati):
   - Bebas Keterlambatan (is_late = False) & Bebas Denda (denda = 0).
2. Guru Khusus (seperti Husna & Dinda - jadwal Kamis, Jumat, Sabtu):
   - Keterlambatan dihitung 1 jam setelah jadwal kelas dimulai.
     Contoh: Jadwal kelas 12:00 -> Batas keterlambatan jam 13:00:00 WIB.
             Jadwal kelas 09:00 -> Batas keterlambatan jam 10:00:00 WIB.
3. Semua Guru & Staf Lainnya (TK, Sempoa SIP, Fonem, Admin, dll.):
   - Jam datang default jam 07:00 WIB.
   - Batas keterlambatan adalah tepat jam 08:00:00 WIB.
     (Datang <= 08:00:00 WIB = Tepat Waktu, Lewat 1 detik saja misal 08:00:01 WIB ke atas = Terlambat).
"""

import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Any

WIB = timezone(timedelta(hours=7))


def is_owner_or_direktur(guru: Any) -> bool:
    """Cek apakah guru memiliki jabatan Direktur/Owner (bebas keterlambatan & denda)."""
    if not guru:
        return False
    nama_lower = (getattr(guru, "nama", "") or "").lower()
    kat_lower = (getattr(guru, "kategori_program", "") or "").lower()
    return any(k in nama_lower or k in kat_lower for k in ["direktur", "owner", "zulhemawati"])


def get_guru_late_threshold(guru: Any, waktu_wib: datetime) -> Tuple[int, int]:
    """
    Mengembalikan tuple (batas_jam, batas_menit) dalam WIB.
    Jika waktu kehadiran > batas tersebut, maka guru dinyatakan TERLAMBAT.
    """
    if not guru or is_owner_or_direktur(guru):
        return (24, 0)  # Tidak pernah terlambat

    nama_lower = (getattr(guru, "nama", "") or "").lower()
    paket_pengajaran = (getattr(guru, "paket_pengajaran", "") or "").strip()

    # Ekstrak jam mulai kelas dari paket_pengajaran jika ada format HH:MM
    start_hour = None
    start_minute = 0
    match = re.search(r'(\d{1,2}):(\d{2})', paket_pengajaran)
    if match:
        try:
            start_hour = int(match.group(1))
            start_minute = int(match.group(2))
        except (ValueError, TypeError):
            start_hour = None

    w_day = waktu_wib.weekday()  # 0=Senin, 1=Selasa, 2=Rabu, 3=Kamis, 4=Jumat, 5=Sabtu, 6=Minggu

    is_dinda = "dinda" in nama_lower
    is_husna = "husna" in nama_lower

    # Aturan Khusus Dinda & Husna (jadwal Kamis, Jumat, Sabtu)
    if is_dinda:
        if w_day == 4:  # Jumat (jadwal kelas siang 12:00 -> batas telat 13:00)
            base_h = start_hour if (start_hour is not None and start_hour >= 11) else 12
            return (base_h + 1, start_minute)
        elif w_day == 5:  # Sabtu (jadwal kelas 09:00 atau 12:00 -> +1 jam)
            if start_hour is not None:
                return (start_hour + 1, start_minute)
            return (10, 0)  # Default Sabtu jam 09:00 + 1 jam = 10:00 WIB
        elif start_hour is not None and start_hour >= 9:
            return (start_hour + 1, start_minute)

    elif is_husna:
        if w_day == 3:  # Kamis (jadwal kelas siang 12:00 -> batas telat 13:00)
            base_h = start_hour if (start_hour is not None and start_hour >= 11) else 12
            return (base_h + 1, start_minute)
        elif start_hour is not None and start_hour >= 9:
            return (start_hour + 1, start_minute)

    # Jika ada guru lain yang memiliki jam kelas khusus (misal jadwal mulai kelas di atas jam 08:00)
    # dan profilnya khusus pengajar kelas tertentu
    hari_wajib = (getattr(guru, "hari_wajib", "") or "").lower()
    if any(h in hari_wajib for h in ["jumat", "sabtu", "kamis"]) and not any(h in hari_wajib for h in ["senin", "selasa", "rabu"]):
        if start_hour is not None and start_hour >= 9:
            return (start_hour + 1, start_minute)

    # Standar untuk SEMUA guru lainnya (TK, Sempoa SIP, Fonem, Admin, dll.)
    # Default datang jam 07:00, batas toleransi keterlambatan adalah jam 08:00 pagi WIB
    return (8, 0)


def check_is_guru_late(guru: Any, waktu_dt: datetime) -> bool:
    """
    Evaluasi apakah presensi guru terlambat.
    Aturan Tegas:
    - Datang <= batas waktu (misal <= 08:00:00 WIB) = Tepat Waktu (HADIR).
    - Lewat 1 detik dari batas waktu (misal 08:00:01 ke atas) = TERLAMBAT.
    - Direktur / Owner = Selalu bebas keterlambatan & denda.
    """
    if not guru or is_owner_or_direktur(guru):
        return False

    w_wib = waktu_dt.astimezone(WIB) if waktu_dt.tzinfo else waktu_dt.replace(tzinfo=WIB)

    th, tm = get_guru_late_threshold(guru, w_wib)
    if th < 8:
        th, tm = 8, 0

    sec = getattr(w_wib, "second", 0)
    # Lewat 1 detik dari batas waktu yang ditentukan langsung terhitung TERLAMBAT
    if w_wib.hour > th:
        return True
    if w_wib.hour == th and w_wib.minute > tm:
        return True
    if w_wib.hour == th and w_wib.minute == tm and sec > 0:
        return True

    return False
