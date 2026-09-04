"""
Authoritative Constants for Sempoa SIP TC Pariaman
Defines programs, default quotas, fees, and standard operation thresholds.
"""

PROGRAM_CONFIG = {
    "Sempoa SIP": {
        "nama": "Sempoa SIP",
        "default_target_pertemuan": 8,
        "paket_12_pertemuan": 12,
        "biaya_spp": 350000.0,
        "jam_default": {"mulai": "09:00", "selesai": "17:00"}
    },
    "Fonem": {
        "nama": "Fonem",
        "default_target_pertemuan": 12,
        "biaya_spp": 200000.0,
        "jam_default": {"mulai": "09:00", "selesai": "17:00"}
    },
    "Tahfidz": {
        "nama": "Tahfidz",
        "default_target_pertemuan": 12,
        "biaya_spp": 200000.0,
        "jam_default": {"mulai": "12:00", "selesai": "17:00"}
    },
    "Bahasa Inggris": {
        "nama": "Bahasa Inggris",
        "default_target_pertemuan": 8,
        "biaya_spp": 200000.0,
        "jam_default": {"mulai": "12:00", "selesai": "17:00"}
    },
    "TK": {
        "nama": "TK",
        "default_target_pertemuan": 20,
        "biaya_spp": 400000.0,
        "jam_default": {"mulai": "07:30", "selesai": "13:30"},
        "hari_masuk": "Senin - Jumat"
    }
}

DEFAULT_DENDA_PER_TERLAMBAT = 1000
MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024  # 50MB

def get_program_spp_nominal(db, program_name: str, paket_jadwal: str = None) -> float:
    """
    Get dynamic SPP fee from database ProgramSetting with fallback to constants.
    """
    if not program_name:
        return 200000.0

    p_lower = program_name.strip().lower()
    search_name = program_name.strip()
    
    if "sempoa" in p_lower:
        if paket_jadwal and "12" in paket_jadwal:
            search_name = "Sempoa SIP (12 Sesi)"
        else:
            search_name = "Sempoa SIP (8 Sesi)"

    # Check database ProgramSetting first
    try:
        from app.models.program_setting import ProgramSetting
        setting = db.query(ProgramSetting).filter(ProgramSetting.nama_program == search_name).first()
        if setting and setting.biaya_spp:
            return float(setting.biaya_spp)
    except Exception:
        pass

    # Fallback to in-memory config
    if "sempoa" in p_lower:
        return 350000.0
    elif "tk" in p_lower:
        return 400000.0
    return 200000.0


