"""add_lectures_table_and_calendar_source_tracking

Revision ID: fe5f84f7f456
Revises: 21ddc6f57033
Create Date: 2026-01-20 09:49:19.707352

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fe5f84f7f456'
down_revision: Union[str, Sequence[str], None] = '21ddc6f57033'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create lectures table
    op.create_table(
        'lectures',
        sa.Column('module_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('recurrence_start_date', sa.Date(), nullable=False),
        sa.Column('recurrence_end_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lectures_created_at'), 'lectures', ['created_at'], unique=False)
    op.create_index(op.f('ix_lectures_id'), 'lectures', ['id'], unique=True)
    op.create_index(op.f('ix_lectures_module_id'), 'lectures', ['module_id'], unique=False)

    # Add source tracking columns to calendar_items
    op.add_column('calendar_items', sa.Column('source_type', sa.String(length=50), nullable=True))
    op.add_column('calendar_items', sa.Column('source_id', sa.String(length=36), nullable=True))

    # Add indexes for source tracking
    op.create_index(op.f('ix_calendar_items_source_id'), 'calendar_items', ['source_id'], unique=False)
    op.create_index(op.f('ix_calendar_items_source_type'), 'calendar_items', ['source_type'], unique=False)
    op.create_index('ix_calendar_items_source', 'calendar_items', ['source_type', 'source_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove source tracking indexes and columns from calendar_items
    op.drop_index('ix_calendar_items_source', table_name='calendar_items')
    op.drop_index(op.f('ix_calendar_items_source_type'), table_name='calendar_items')
    op.drop_index(op.f('ix_calendar_items_source_id'), table_name='calendar_items')
    op.drop_column('calendar_items', 'source_id')
    op.drop_column('calendar_items', 'source_type')

    # Drop lectures table
    op.drop_index(op.f('ix_lectures_module_id'), table_name='lectures')
    op.drop_index(op.f('ix_lectures_id'), table_name='lectures')
    op.drop_index(op.f('ix_lectures_created_at'), table_name='lectures')
    op.drop_table('lectures')
