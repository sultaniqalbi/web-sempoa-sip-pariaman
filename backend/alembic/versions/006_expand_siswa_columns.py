"""006_expand_siswa_columns

Revision ID: 006_expand_siswa_columns
Revises: 005_multi_guru_jadwal
Create Date: 2026-08-29 12:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '006_expand_siswa_columns'
down_revision: Union[str, None] = '005_multi_guru_jadwal'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Expand columns in siswa table to allow multi-program strings and combined packages
    op.alter_column(
        'siswa',
        'kategori_program',
        existing_type=sa.String(length=50),
        type_=sa.String(length=255),
        existing_nullable=False
    )
    op.alter_column(
        'siswa',
        'paket_jadwal',
        existing_type=sa.String(length=50),
        type_=sa.String(length=255),
        existing_nullable=True
    )
    op.alter_column(
        'siswa',
        'hari_masuk',
        existing_type=sa.String(length=50),
        type_=sa.String(length=255),
        existing_nullable=False
    )


def downgrade() -> None:
    op.alter_column(
        'siswa',
        'hari_masuk',
        existing_type=sa.String(length=255),
        type_=sa.String(length=50),
        existing_nullable=False
    )
    op.alter_column(
        'siswa',
        'paket_jadwal',
        existing_type=sa.String(length=255),
        type_=sa.String(length=50),
        existing_nullable=True
    )
    op.alter_column(
        'siswa',
        'kategori_program',
        existing_type=sa.String(length=255),
        type_=sa.String(length=50),
        existing_nullable=False
    )
