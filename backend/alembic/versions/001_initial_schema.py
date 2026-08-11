"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-11 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Drop types if previously partially created
    op.execute('DROP TYPE IF EXISTS pendaftaran_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS bukti_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS pembayaran_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS jenis_keuangan_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS absensi_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS absensi_mode_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS spp_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS user_role_enum CASCADE')

    # Explicit Enum Types
    user_role_enum = postgresql.ENUM('admin', 'owner', 'guru', 'ortu', 'siswa', name='user_role_enum')
    user_role_enum.create(op.get_bind(), checkfirst=True)

    spp_status_enum = postgresql.ENUM('AKTIF', 'EXPIRED', name='spp_status_enum')
    spp_status_enum.create(op.get_bind(), checkfirst=True)

    absensi_mode_enum = postgresql.ENUM('ONLINE', 'OFFLINE', name='absensi_mode_enum')
    absensi_mode_enum.create(op.get_bind(), checkfirst=True)

    absensi_status_enum = postgresql.ENUM('HADIR', 'IZIN', 'ALFA', 'TERLAMBAT', name='absensi_status_enum')
    absensi_status_enum.create(op.get_bind(), checkfirst=True)

    jenis_keuangan_enum = postgresql.ENUM('PEMBAYARAN_SPP', 'PENDAFTARAN', 'PENGELUARAN', 'LAINNYA', name='jenis_keuangan_enum')
    jenis_keuangan_enum.create(op.get_bind(), checkfirst=True)

    pembayaran_status_enum = postgresql.ENUM('MENUNGGAK', 'PENDING_VERIFIKASI', 'LUNAS', 'OVERDUE', name='pembayaran_status_enum')
    pembayaran_status_enum.create(op.get_bind(), checkfirst=True)

    bukti_status_enum = postgresql.ENUM('pending', 'approved', 'rejected', name='bukti_status_enum')
    bukti_status_enum.create(op.get_bind(), checkfirst=True)

    pendaftaran_status_enum = postgresql.ENUM('BARU', 'DIHUBUNGI', 'DITERIMA', name='pendaftaran_status_enum')
    pendaftaran_status_enum.create(op.get_bind(), checkfirst=True)

    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('password', sa.String(length=255), nullable=False),
        sa.Column('role', postgresql.ENUM('admin', 'owner', 'guru', 'ortu', 'siswa', name='user_role_enum', create_type=False), nullable=False),
        sa.Column('nama', sa.String(length=100), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('foto_profil', sa.String(length=255), nullable=True),
        sa.Column('uid_terhubung', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. guru
    op.create_table(
        'guru',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uid', sa.String(length=50), nullable=False),
        sa.Column('nama', sa.String(length=100), nullable=False),
        sa.Column('kategori_program', sa.String(length=50), nullable=False, server_default='Sempoa SIP'),
        sa.Column('hari_wajib', sa.String(length=100), nullable=False),
        sa.Column('target_kehadiran', sa.Integer(), nullable=False, server_default='12'),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('foto_profil', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uid')
    )
    op.create_index(op.f('ix_guru_id'), 'guru', ['id'], unique=False)
    op.create_index(op.f('ix_guru_uid'), 'guru', ['uid'], unique=True)

    # 3. siswa
    op.create_table(
        'siswa',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uid', sa.String(length=50), nullable=False),
        sa.Column('nama', sa.String(length=100), nullable=False),
        sa.Column('kategori_program', sa.String(length=50), nullable=False),
        sa.Column('hari_masuk', sa.String(length=50), nullable=False),
        sa.Column('id_guru', sa.Integer(), nullable=True),
        sa.Column('target_pertemuan', sa.Integer(), nullable=False, server_default='8'),
        sa.Column('sisa_pertemuan', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status_spp', postgresql.ENUM('AKTIF', 'EXPIRED', name='spp_status_enum', create_type=False), nullable=False, server_default='AKTIF'),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('foto_profil', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_guru'], ['guru.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uid')
    )
    op.create_index(op.f('ix_siswa_id'), 'siswa', ['id'], unique=False)
    op.create_index(op.f('ix_siswa_id_guru'), 'siswa', ['id_guru'], unique=False)
    op.create_index(op.f('ix_siswa_uid'), 'siswa', ['uid'], unique=True)

    # 4. absensi_log
    op.create_table(
        'absensi_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uid', sa.String(length=50), nullable=False),
        sa.Column('waktu', sa.DateTime(timezone=True), nullable=False),
        sa.Column('mode', postgresql.ENUM('ONLINE', 'OFFLINE', name='absensi_mode_enum', create_type=False), nullable=False, server_default='ONLINE'),
        sa.Column('status', postgresql.ENUM('HADIR', 'IZIN', 'ALFA', 'TERLAMBAT', name='absensi_status_enum', create_type=False), nullable=False, server_default='HADIR'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_absensi_log_id'), 'absensi_log', ['id'], unique=False)
    op.create_index('idx_absensi_uid_waktu', 'absensi_log', ['uid', 'waktu'], unique=False)

    # 5. jadwal
    op.create_table(
        'jadwal',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('id_guru', sa.Integer(), nullable=True),
        sa.Column('id_siswa', sa.Integer(), nullable=True),
        sa.Column('hari', sa.String(length=20), nullable=False),
        sa.Column('jam_mulai', sa.String(length=10), nullable=False),
        sa.Column('jam_selesai', sa.String(length=10), nullable=False),
        sa.Column('lokasi', sa.String(length=100), nullable=False, server_default='TC Pariaman'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_guru'], ['guru.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['id_siswa'], ['siswa.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_jadwal_id'), 'jadwal', ['id'], unique=False)
    op.create_index(op.f('ix_jadwal_id_guru'), 'jadwal', ['id_guru'], unique=False)
    op.create_index(op.f('ix_jadwal_id_siswa'), 'jadwal', ['id_siswa'], unique=False)

    # 6. keuangan
    op.create_table(
        'keuangan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('id_siswa', sa.Integer(), nullable=True),
        sa.Column('jenis', postgresql.ENUM('PEMBAYARAN_SPP', 'PENDAFTARAN', 'PENGELUARAN', 'LAINNYA', name='jenis_keuangan_enum', create_type=False), nullable=False, server_default='PEMBAYARAN_SPP'),
        sa.Column('jumlah', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('tanggal', sa.Date(), server_default=sa.text('CURRENT_DATE'), nullable=False),
        sa.Column('keterangan', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_siswa'], ['siswa.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_keuangan_id'), 'keuangan', ['id'], unique=False)
    op.create_index(op.f('ix_keuangan_id_siswa'), 'keuangan', ['id_siswa'], unique=False)

    # 7. pembayaran_periode
    op.create_table(
        'pembayaran_periode',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('id_siswa', sa.Integer(), nullable=False),
        sa.Column('periode_bulan', sa.String(length=20), nullable=False),
        sa.Column('jumlah', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('status', postgresql.ENUM('MENUNGGAK', 'PENDING_VERIFIKASI', 'LUNAS', 'OVERDUE', name='pembayaran_status_enum', create_type=False), nullable=False, server_default='MENUNGGAK'),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_siswa'], ['siswa.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pembayaran_periode_id'), 'pembayaran_periode', ['id'], unique=False)
    op.create_index(op.f('ix_pembayaran_periode_id_siswa'), 'pembayaran_periode', ['id_siswa'], unique=False)
    op.create_index('idx_pembayaran_siswa_status', 'pembayaran_periode', ['id_siswa', 'status'], unique=False)

    # 8. bukti_transfer
    op.create_table(
        'bukti_transfer',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('id_pembayaran', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(length=255), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'approved', 'rejected', name='bukti_status_enum', create_type=False), nullable=False, server_default='pending'),
        sa.Column('admin_note', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_pembayaran'], ['pembayaran_periode.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bukti_transfer_id'), 'bukti_transfer', ['id'], unique=False)
    op.create_index(op.f('ix_bukti_transfer_id_pembayaran'), 'bukti_transfer', ['id_pembayaran'], unique=False)

    # 9. galeri
    op.create_table(
        'galeri',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('judul', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('deskripsi', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_galeri_id'), 'galeri', ['id'], unique=False)

    # 10. pendaftaran_baru
    op.create_table(
        'pendaftaran_baru',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nama_ortu', sa.String(length=100), nullable=False),
        sa.Column('nama_anak', sa.String(length=100), nullable=False),
        sa.Column('umur_anak', sa.String(length=20), nullable=False),
        sa.Column('nomor_wa', sa.String(length=20), nullable=False),
        sa.Column('program_studi', sa.String(length=100), nullable=False),
        sa.Column('catatan', sa.Text(), nullable=True),
        sa.Column('waktu_daftar', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('status', postgresql.ENUM('BARU', 'DIHUBUNGI', 'DITERIMA', name='pendaftaran_status_enum', create_type=False), nullable=False, server_default='BARU'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pendaftaran_baru_id'), 'pendaftaran_baru', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('pendaftaran_baru')
    op.drop_table('galeri')
    op.drop_table('bukti_transfer')
    op.drop_table('pembayaran_periode')
    op.drop_table('keuangan')
    op.drop_table('jadwal')
    op.drop_table('absensi_log')
    op.drop_table('siswa')
    op.drop_table('guru')
    op.drop_table('users')

    op.execute('DROP TYPE IF EXISTS pendaftaran_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS bukti_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS pembayaran_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS jenis_keuangan_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS absensi_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS absensi_mode_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS spp_status_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS user_role_enum CASCADE')
