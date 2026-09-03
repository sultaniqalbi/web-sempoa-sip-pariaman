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
        "default_target_pertemuan": 0,
        "biaya_spp": 200000.0,
        "jam_default": {"mulai": "08:00", "selesai": "11:00"}
    }
}

DEFAULT_DENDA_PER_TERLAMBAT = 1000
MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024  # 50MB
