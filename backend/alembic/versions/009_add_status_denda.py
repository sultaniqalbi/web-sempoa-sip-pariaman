"""add status_denda to absensi_log

Revision ID: 009_add_status_denda
Revises: 008_add_guru_jam
Create Date: 2026-09-11 14:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '009_add_status_denda'
down_revision = '008_add_guru_jam'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('absensi_log', sa.Column('status_denda', sa.String(length=20), nullable=True, server_default='BELUM_LUNAS'))


def downgrade():
    op.drop_column('absensi_log', 'status_denda')
