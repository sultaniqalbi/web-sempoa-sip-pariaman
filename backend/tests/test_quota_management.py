import pytest
from app.models.siswa import Siswa
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran

def test_quota_decrement_and_auto_expire(client, db_session, admin_headers):
    # 1. Create a student with 1 remaining meeting (quota = 1)
    siswa = Siswa(
        uid="SI-QUOTA-001",
        nama="Siswa Quota",
        kategori_program="Sempoa SIP",
        hari_masuk="Rabu",
        target_pertemuan=8,
        sisa_pertemuan=1,
        status_spp="AKTIF"
    )
    db_session.add(siswa)
    db_session.commit()

    # 2. Submit attendance log (status = HADIR)
    absensi_data = {
        "uid": "SI-QUOTA-001",
        "waktu": "2026-08-11T16:00:00",
        "mode": "ONLINE",
        "status": "HADIR"
    }
    response = client.post("/api/v1/absensi/", json=absensi_data, headers=admin_headers)
    assert response.status_code == 201

    # Verify quota decremented to 0, status changed to EXPIRED, and billing created
    db_session.refresh(siswa)
    assert siswa.sisa_pertemuan == 0
    assert siswa.status_spp == "EXPIRED"

    billing = db_session.query(PembayaranPeriode).filter(
        PembayaranPeriode.id_siswa == siswa.id,
        PembayaranPeriode.status == StatusPembayaran.MENUNGGAK
    ).first()
    assert billing is not None
    assert billing.jumlah == 150000.00

    # 3. Test Manual Restore (Admin only)
    restore_res = client.post(f"/api/v1/quota/siswa/{siswa.id}/restore", headers=admin_headers)
    assert restore_res.status_code == 200
    assert restore_res.json()["sisa_pertemuan"] == 8
    assert restore_res.json()["status_spp"] == "AKTIF"

    db_session.refresh(siswa)
    db_session.refresh(billing)
    assert siswa.sisa_pertemuan == 8
    assert siswa.status_spp == "AKTIF"
    assert billing.status == StatusPembayaran.LUNAS

def test_quota_manual_restore_forbidden_role(client, db_session, guru_headers):
    siswa = Siswa(
        uid="SI-QUOTA-002",
        nama="Siswa Quota Dua",
        kategori_program="Sempoa SIP",
        hari_masuk="Rabu",
        target_pertemuan=8,
        sisa_pertemuan=0,
        status_spp="EXPIRED"
    )
    db_session.add(siswa)
    db_session.commit()

    # Guru is forbidden from manually restoring student quota
    response = client.post(f"/api/v1/quota/siswa/{siswa.id}/restore", headers=guru_headers)
    assert response.status_code == 403
