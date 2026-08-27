"""003_add_absensi_catatan_sumber

Revision ID: 003_add_absensi_catatan_sumber
Revises: 002_add_siswa_soft_delete
Create Date: 2026-08-27 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_add_absensi_catatan_sumber'
down_revision: Union[str, None] = '002_add_siswa_soft_delete'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('absensi_log', sa.Column('catatan', sa.Text(), nullable=True))
    op.add_column('absensi_log', sa.Column('sumber', sa.String(length=50), server_default='RFID', nullable=True))


def downgrade() -> None:
    op.drop_column('absensi_log', 'sumber')
    op.drop_column('absensi_log', 'catatan')
