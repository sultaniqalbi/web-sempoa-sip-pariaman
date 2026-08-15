import os
from datetime import datetime, timedelta, date
from PIL import Image, ImageDraw
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.users import User, UserRole
from app.models.siswa import Siswa, StatusSPP
from app.models.guru import Guru
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran

def create_avatar(filename: str, text: str, bg_color: tuple, text_color: tuple = (255, 255, 255)):
    os.makedirs("uploads", exist_ok=True)
    filepath = os.path.join("uploads", filename)
    img = Image.new("RGB", (400, 400), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw simple avatar circle
    draw.ellipse([(30, 30), (370, 370)], outline=(255, 255, 255), width=8)
    # Inner filled circle
    draw.ellipse([(45, 45), (355, 355)], fill=bg_color)
    
    # Text
    draw.text((160, 175), text, fill=text_color)
    
    # Save as PNG
    img.save(filepath, "PNG")
    return f"/uploads/{filename}"

def seed():
    db: Session = SessionLocal()
    try:
        print("🌱 Seeding Dummy Students and Teachers...")

        # 1. Create Teacher Avatars & Guru Records
        gurus_data = [
            {
                "uid": "GR-1011",
                "nama": "Ust. Rian Hidayat, S.Pd",
                "nama_panggilan": "Rian",
                "umur": 28,
                "kategori_program": "Sempoa SIP",
                "paket_pengajaran": "Reguler",
                "hari_wajib": "Senin, Selasa, Kamis",
                "whatsapp_guru": "081234567811",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(1998, 5, 12),
                "asal_sekolah": "Universitas Negeri Padang",
                "mode_kelas": "OFFLINE",
                "color": (230, 81, 0),
                "initials": "RH",
                "file": "guru_rian.png",
                "email": "rian.sempoa@gmail.com"
            },
            {
                "uid": "GR-2022",
                "nama": "Usth. Nurul Aini, Lc",
                "nama_panggilan": "Nurul",
                "umur": 26,
                "kategori_program": "Tahfidz",
                "paket_pengajaran": "Reguler",
                "hari_wajib": "Selasa, Kamis, Sabtu",
                "whatsapp_guru": "081234567812",
                "tempat_lahir": "Padang",
                "tanggal_lahir": date(2000, 8, 20),
                "asal_sekolah": "UIN Imam Bonjol",
                "mode_kelas": "OFFLINE",
                "color": (46, 125, 50),
                "initials": "NA",
                "file": "guru_nurul.png",
                "email": "nurul.tahfidz@gmail.com"
            },
            {
                "uid": "GR-3033",
                "nama": "Mr. Kevin Sanjaya, B.Ed",
                "nama_panggilan": "Kevin",
                "umur": 29,
                "kategori_program": "Bahasa Inggris",
                "paket_pengajaran": "Reguler",
                "hari_wajib": "Sabtu, Minggu",
                "whatsapp_guru": "081234567813",
                "tempat_lahir": "Bukittinggi",
                "tanggal_lahir": date(1997, 11, 3),
                "asal_sekolah": "Universitas Andalas",
                "mode_kelas": "ONLINE",
                "color": (198, 40, 40),
                "initials": "KS",
                "file": "guru_kevin.png",
                "email": "kevin.english@gmail.com"
            },
            {
                "uid": "GR-4044",
                "nama": "Ibu Dian Permatasari, S.Psi",
                "nama_panggilan": "Dian",
                "umur": 27,
                "kategori_program": "Fonem",
                "paket_pengajaran": "Reguler",
                "hari_wajib": "Senin, Rabu, Jumat",
                "whatsapp_guru": "081234567814",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(1999, 2, 14),
                "asal_sekolah": "Universitas Putra Indonesia",
                "mode_kelas": "OFFLINE",
                "color": (0, 131, 143),
                "initials": "DP",
                "file": "guru_dian.png",
                "email": "dian.fonem@gmail.com"
            }
        ]

        created_gurus = []
        for g_info in gurus_data:
            existing_g = db.query(Guru).filter(Guru.uid == g_info["uid"]).first()
            photo_url = create_avatar(g_info["file"], g_info["initials"], g_info["color"])
            
            if not existing_g:
                guru = Guru(
                    uid=g_info["uid"],
                    nama=g_info["nama"],
                    nama_panggilan=g_info["nama_panggilan"],
                    umur=g_info["umur"],
                    kategori_program=g_info["kategori_program"],
                    paket_pengajaran=g_info["paket_pengajaran"],
                    hari_wajib=g_info["hari_wajib"],
                    whatsapp_guru=g_info["whatsapp_guru"],
                    tempat_lahir=g_info["tempat_lahir"],
                    tanggal_lahir=g_info["tanggal_lahir"],
                    asal_sekolah=g_info["asal_sekolah"],
                    mode_kelas=g_info["mode_kelas"],
                    foto_profil=photo_url,
                    is_deleted=False
                )
                db.add(guru)
                db.flush()

                # User account
                user_guru = User(
                    email=g_info["email"],
                    password=get_password_hash("guru12345"),
                    role=UserRole.guru,
                    nama=g_info["nama"],
                    uid_terhubung=str(guru.id)
                )
                db.add(user_guru)
                created_gurus.append(guru)
            else:
                existing_g.foto_profil = photo_url
                created_gurus.append(existing_g)

        db.commit()

        # 2. Create Student Avatars & Siswa Records
        students_data = [
            {
                "uid": "sp-0726",
                "nama": "Ahmad Farhan",
                "nama_panggilan": "Farhan",
                "umur": 7,
                "kelas_sekolah": "1 SD",
                "kategori_program": "Sempoa SIP",
                "paket_jadwal": "Paket 1: 8 Pertemuan, 90 Menit",
                "hari_masuk": "Senin, Kamis",
                "target_pertemuan": 8,
                "sisa_pertemuan": 6, # 75% -> Lancar (Hijau)
                "status_spp": StatusSPP.AKTIF,
                "nama_orang_tua": "Bpk. Rahmat Farhan",
                "whatsapp_orang_tua": "081234567801",
                "alamat": "Jl. Merdeka No. 12, Pariaman Tengah",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(2019, 3, 15),
                "asal_sekolah": "SDN 01 Pariaman",
                "days_ago": 10,
                "color": (255, 112, 67),
                "initials": "AF",
                "file": "siswa_farhan.png",
                "email": "ortu.farhan@gmail.com"
            },
            {
                "uid": "sp-0826",
                "nama": "Siti Rahmah",
                "nama_panggilan": "Rahmah",
                "umur": 8,
                "kelas_sekolah": "2 SD",
                "kategori_program": "Sempoa SIP",
                "paket_jadwal": "Paket 2: 12 Pertemuan, 60 Menit",
                "hari_masuk": "Selasa, Jumat",
                "target_pertemuan": 12,
                "sisa_pertemuan": 4, # 33% -> Peringatan (Kuning <= 40%)
                "status_spp": StatusSPP.AKTIF,
                "nama_orang_tua": "Ibu Maryam",
                "whatsapp_orang_tua": "081234567802",
                "alamat": "Jl. Sudirman No. 45, Pariaman",
                "tempat_lahir": "Padang",
                "tanggal_lahir": date(2018, 6, 20),
                "asal_sekolah": "SD IT Mutiara",
                "days_ago": 18,
                "color": (255, 167, 38),
                "initials": "SR",
                "file": "siswa_rahmah.png",
                "email": "ortu.rahmah@gmail.com"
            },
            {
                "uid": "fn-0526",
                "nama": "Bintang Pratama",
                "nama_panggilan": "Bintang",
                "umur": 5,
                "kelas_sekolah": "TK B",
                "kategori_program": "Fonem",
                "paket_jadwal": "Paket Reguler: 12 Pertemuan, 60 Menit",
                "hari_masuk": "Senin, Rabu, Jumat",
                "target_pertemuan": 12,
                "sisa_pertemuan": 2, # 16% -> Urgent (Merah < 20%)
                "status_spp": StatusSPP.AKTIF,
                "nama_orang_tua": "Bpk. Hendra Pratama",
                "whatsapp_orang_tua": "081234567803",
                "alamat": "Komp. Griya Pariaman Blok B3",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(2021, 2, 10),
                "asal_sekolah": "TK Kemala Bhayangkari",
                "days_ago": 24,
                "color": (0, 150, 136),
                "initials": "BP",
                "file": "siswa_bintang.png",
                "email": "ortu.bintang@gmail.com"
            },
            {
                "uid": "bi-0926",
                "nama": "Aisyah Putri",
                "nama_panggilan": "Aisyah",
                "umur": 9,
                "kelas_sekolah": "3 SD",
                "kategori_program": "Bahasa Inggris",
                "paket_jadwal": "Paket Reguler: 2 Pertemuan, 90 Menit",
                "hari_masuk": "Sabtu, Minggu",
                "target_pertemuan": 2,
                "sisa_pertemuan": 0, # 0% -> Urgent / Kuota Habis
                "status_spp": StatusSPP.EXPIRED,
                "nama_orang_tua": "Ibu Fatimah",
                "whatsapp_orang_tua": "081234567804",
                "alamat": "Jl. Khatib Sulaiman No. 8",
                "tempat_lahir": "Bukittinggi",
                "tanggal_lahir": date(2017, 9, 5),
                "asal_sekolah": "SDN 03 Pariaman",
                "days_ago": 28,
                "color": (156, 39, 176),
                "initials": "AP",
                "file": "siswa_aisyah.png",
                "email": "ortu.aisyah@gmail.com"
            },
            {
                "uid": "td-0626",
                "nama": "Muhammad Zaki",
                "nama_panggilan": "Zaki",
                "umur": 6,
                "kelas_sekolah": "TK B",
                "kategori_program": "Tahfidz",
                "paket_jadwal": "Paket Reguler: 12 Pertemuan, 60 Menit",
                "hari_masuk": "Selasa, Kamis",
                "target_pertemuan": 12,
                "sisa_pertemuan": 5, # Hangus (Lewat 30 hari)
                "status_spp": StatusSPP.EXPIRED,
                "nama_orang_tua": "Bpk. Zulkifli",
                "whatsapp_orang_tua": "081234567805",
                "alamat": "Desa Rawang, Pariaman Tengah",
                "tempat_lahir": "Pariaman",
                "tanggal_lahir": date(2020, 4, 12),
                "asal_sekolah": "TK Aisyiyah Pariaman",
                "days_ago": 42, # > 30 hari -> Hangus
                "color": (67, 160, 71),
                "initials": "MZ",
                "file": "siswa_zaki.png",
                "email": "ortu.zaki@gmail.com"
            }
        ]

        for s_info in students_data:
            existing_s = db.query(Siswa).filter(Siswa.uid == s_info["uid"]).first()
            photo_url = create_avatar(s_info["file"], s_info["initials"], s_info["color"])
            reg_date = datetime.utcnow() - timedelta(days=s_info["days_ago"])
            
            if not existing_s:
                siswa = Siswa(
                    uid=s_info["uid"],
                    nama=s_info["nama"],
                    nama_panggilan=s_info["nama_panggilan"],
                    umur=s_info["umur"],
                    kelas_sekolah=s_info["kelas_sekolah"],
                    kategori_program=s_info["kategori_program"],
                    paket_jadwal=s_info["paket_jadwal"],
                    hari_masuk=s_info["hari_masuk"],
                    target_pertemuan=s_info["target_pertemuan"],
                    sisa_pertemuan=s_info["sisa_pertemuan"],
                    status_spp=s_info["status_spp"],
                    nama_orang_tua=s_info["nama_orang_tua"],
                    whatsapp_orang_tua=s_info["whatsapp_orang_tua"],
                    alamat=s_info["alamat"],
                    tempat_lahir=s_info["tempat_lahir"],
                    tanggal_lahir=s_info["tanggal_lahir"],
                    asal_sekolah=s_info["asal_sekolah"],
                    foto_profil=photo_url,
                    created_at=reg_date,
                    is_deleted=False
                )
                db.add(siswa)
                db.flush()

                # Initial Payment
                nominal = 350000.00 if "sempoa" in s_info["kategori_program"].lower() else 200000.00
                due_date = reg_date.date() + timedelta(days=30)
                pembayaran = PembayaranPeriode(
                    id_siswa=siswa.id,
                    periode_bulan=reg_date.strftime("%Y-%m"),
                    jumlah=nominal,
                    status=StatusPembayaran.LUNAS if s_info["days_ago"] <= 30 else StatusPembayaran.OVERDUE,
                    due_date=due_date,
                    created_at=reg_date
                )
                db.add(pembayaran)

                # Parent Account
                user_ortu = User(
                    email=s_info["email"],
                    password=get_password_hash("ortu12345"),
                    role=UserRole.ortu,
                    nama=s_info["nama_orang_tua"],
                    uid_terhubung=str(siswa.id)
                )
                db.add(user_ortu)
            else:
                existing_s.foto_profil = photo_url

        db.commit()
        print("✅ 5 Dummy Students and 4 Dummy Teachers seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
