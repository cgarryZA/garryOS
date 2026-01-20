"""add_coursework_task_sync_fields

Revision ID: f885a7f69c33
Revises: fe5f84f7f456
Create Date: 2026-01-20 09:52:50.372437

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f885a7f69c33'
down_revision: Union[str, Sequence[str], None] = 'fe5f84f7f456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add linked_task_id to coursework table for two-way sync with calendar tasks
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('coursework', schema=None) as batch_op:
        batch_op.add_column(sa.Column('linked_task_id', sa.String(length=36), nullable=True))
        batch_op.create_foreign_key('fk_coursework_linked_task', 'calendar_items', ['linked_task_id'], ['id'], ondelete='SET NULL')
        batch_op.create_index(batch_op.f('ix_coursework_linked_task_id'), ['linked_task_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove linked_task_id from coursework table
    with op.batch_alter_table('coursework', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_coursework_linked_task_id'))
        batch_op.drop_constraint('fk_coursework_linked_task', type_='foreignkey')
        batch_op.drop_column('linked_task_id')
