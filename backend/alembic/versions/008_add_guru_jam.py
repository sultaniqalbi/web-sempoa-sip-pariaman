"""add jam_masuk and jam_keluar to guru

Revision ID: 008_add_guru_jam
Revises: 007_waktu_keluar
Create Date: 2026-09-03 08:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008_add_guru_jam'
down_revision = '007_waktu_keluar'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('guru', sa.Column('jam_masuk', sa.String(length=5), nullable=True))
    op.add_column('guru', sa.Column('jam_keluar', sa.String(length=5), nullable=True))


def downgrade():
    op.drop_column('guru', 'jam_keluar')
    op.drop_column('guru', 'jam_masuk')
