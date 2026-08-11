"""002_add_siswa_soft_delete

Revision ID: 002_add_siswa_soft_delete
Revises: 001_initial_schema
Create Date: 2026-08-11 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_siswa_soft_delete'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('siswa', sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('siswa', 'is_deleted')
