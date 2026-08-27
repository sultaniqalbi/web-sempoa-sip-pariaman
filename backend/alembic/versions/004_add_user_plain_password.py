"""004_add_user_plain_password

Revision ID: 004_add_user_plain_password
Revises: 003_add_absensi_catatan_sumber
Create Date: 2026-08-27 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_add_user_plain_password'
down_revision: Union[str, None] = '003_add_absensi_catatan_sumber'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('plain_password', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'plain_password')
