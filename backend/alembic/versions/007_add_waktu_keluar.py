"""add waktu_keluar to absensi_log

Revision ID: 007_waktu_keluar
Revises: 006_expand_siswa_columns
Create Date: 2026-09-02 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007_waktu_keluar'
down_revision = '006_expand_siswa_columns'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('absensi_log', sa.Column('waktu_keluar', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('absensi_log', 'waktu_keluar')
