"""005_multi_program_guru_and_multi_teacher_jadwal

Revision ID: 005_multi_guru_jadwal
Revises: 004_add_user_plain_password
Create Date: 2026-08-28 19:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005_multi_guru_jadwal'
down_revision: Union[str, None] = '004_add_user_plain_password'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Expand kategori_program in guru table
    op.alter_column(
        'guru',
        'kategori_program',
        existing_type=sa.String(length=50),
        type_=sa.String(length=255),
        existing_nullable=False
    )
    # 2. Add guru_ids to jadwal table
    op.add_column('jadwal', sa.Column('guru_ids', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('jadwal', 'guru_ids')
    op.alter_column(
        'guru',
        'kategori_program',
        existing_type=sa.String(length=255),
        type_=sa.String(length=50),
        existing_nullable=False
    )
