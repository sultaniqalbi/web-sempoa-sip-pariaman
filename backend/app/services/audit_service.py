from typing import Optional, Union, Any, Dict
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

def log_activity(
    db: Session,
    action: str,               # 'PENAMBAHAN', 'PERUBAHAN', 'PENGHAPUSAN', 'VERIFIKASI', 'LOGIN', 'SYSTEM'
    role: str,                 # 'admin', 'owner', 'guru', 'ortu', 'system'
    email: str,                # user email
    modul: str,                # 'Data Siswa', 'Data Guru', 'Keuangan & SPP', 'Absensi', 'Data Buku', 'Evaluasi', 'Jadwal & Kelas', 'Pengaturan'
    deskripsi: str,            # Human-readable clear description
    status: str = "SUCCESS",   # 'SUCCESS' / 'FAILED'
    target_id: Optional[Union[int, str]] = None,
    target_nama: Optional[str] = None,
    before: Optional[Any] = None,
    after: Optional[Any] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
    auto_commit: bool = False
) -> Optional[AuditLog]:
    """
    Catat aktivitas pengguna ke tabel audit_log secara aman tanpa memicu crash transaksi utama.
    """
    try:
        details_payload = {
            "modul": modul,
            "deskripsi": deskripsi,
            "target_id": str(target_id) if target_id is not None else None,
            "target_nama": target_nama,
            "before": before,
            "after": after,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }
        if extra and isinstance(extra, dict):
            details_payload.update(extra)

        audit_entry = AuditLog(
            action=action.upper(),
            role=str(role).lower(),
            email=email or "system@sempoasippariaman.com",
            details=details_payload,
            status=status.upper(),
            timestamp=datetime.utcnow()
        )
        db.add(audit_entry)
        if auto_commit:
            db.commit()
            db.refresh(audit_entry)
        return audit_entry
    except Exception as err:
        logger.warning(f"Gagal mencatat audit log [{action}]: {err}")
        return None
