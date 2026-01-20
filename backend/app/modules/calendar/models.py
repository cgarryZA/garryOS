"""
Calendar module models for HomeOS

Includes:
- User management
- Event logging
- Calendar items (events, tasks, reminders)
- Triggers (time, location, progress, NFC)
- Trigger executions
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    Boolean,
    ForeignKey,
    Enum,
    Index,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship

from app.models import BaseModel


class User(BaseModel):
    """User model for authentication and ownership"""
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)

    # Relationships
    events = relationship("Event", back_populates="user", cascade="all, delete-orphan")
    calendar_items = relationship("CalendarItem", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"User(id={self.id}, email={self.email!r})"


class Event(BaseModel):
    """Event log for tracking system events and user actions"""
    __tablename__ = "events"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(100), nullable=False, index=True)
    payload = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="events")

    # Indexes
    __table_args__ = (
        Index("ix_events_user_type", "user_id", "type"),
        Index("ix_events_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"Event(id={self.id}, type={self.type!r}, user_id={self.user_id})"


class CalendarItemType(str, enum.Enum):
    """Types of calendar items"""
    EVENT = "event"
    TASK = "task"
    REMINDER = "reminder"


class CalendarItemStatus(str, enum.Enum):
    """Status of calendar items"""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CalendarItem(BaseModel):
    """
    Unified calendar item model supporting events, tasks, and reminders

    - Events: Have start_time and end_time
    - Tasks: Have estimated_duration and progress_percent
    - Reminders: Have start_time (when to remind)
    """
    __tablename__ = "calendar_items"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(Enum(CalendarItemType), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    # Time-related fields
    start_time = Column(DateTime, nullable=True, index=True)
    end_time = Column(DateTime, nullable=True)
    estimated_duration = Column(Integer, nullable=True)  # in minutes

    # Task-specific fields
    progress_percent = Column(Integer, default=0, nullable=False)

    # Recurrence
    recurrence_rule = Column(String(500), nullable=True)  # RRULE format

    # Location
    location = Column(String(500), nullable=True)

    # Status
    status = Column(Enum(CalendarItemStatus), default=CalendarItemStatus.PENDING, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)

    # Source tracking (for integration with other modules)
    source_type = Column(String(50), nullable=True, index=True)  # e.g., 'coursework', 'reminder'
    source_id = Column(String(36), nullable=True, index=True)  # ID from source module

    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="calendar_items")
    triggers = relationship("Trigger", back_populates="calendar_item", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint("progress_percent >= 0 AND progress_percent <= 100", name="check_progress_percent_range"),
        CheckConstraint("estimated_duration IS NULL OR estimated_duration > 0", name="check_estimated_duration_positive"),
        Index("ix_calendar_items_user_type", "user_id", "type"),
        Index("ix_calendar_items_user_status", "user_id", "status"),
        Index("ix_calendar_items_start_time", "start_time"),
        Index("ix_calendar_items_source", "source_type", "source_id"),
    )

    def __repr__(self) -> str:
        return f"CalendarItem(id={self.id}, type={self.type}, title={self.title!r}, status={self.status})"


class TriggerType(str, enum.Enum):
    """Types of triggers"""
    TIME = "time"
    LOCATION = "location"
    PROGRESS = "progress"
    NFC = "nfc"


class Trigger(BaseModel):
    """
    Triggers that can fire based on various conditions

    - TIME: Fire at specific times (e.g., alarm, reminder)
    - LOCATION: Fire when entering/leaving geofence
    - PROGRESS: Fire when task progress reaches threshold
    - NFC: Fire when NFC tag is scanned
    """
    __tablename__ = "triggers"

    calendar_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("calendar_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    trigger_type = Column(Enum(TriggerType), nullable=False, index=True)
    trigger_config = Column(JSON, nullable=False)  # Type-specific configuration
    last_fired_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Relationships
    calendar_item = relationship("CalendarItem", back_populates="triggers")
    executions = relationship("TriggerExecution", back_populates="trigger", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_triggers_calendar_item_type", "calendar_item_id", "trigger_type"),
        Index("ix_triggers_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"Trigger(id={self.id}, type={self.trigger_type}, calendar_item_id={self.calendar_item_id})"


class TriggerExecutionStatus(str, enum.Enum):
    """Status of trigger execution"""
    SUCCESS = "success"
    FAILURE = "failure"


class TriggerExecution(BaseModel):
    """
    Log of trigger executions

    Tracks when triggers fire and their results
    """
    __tablename__ = "trigger_executions"

    trigger_id = Column(
        UUID(as_uuid=True),
        ForeignKey("triggers.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    fired_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    status = Column(Enum(TriggerExecutionStatus), nullable=False, index=True)
    result = Column(JSON, nullable=True)  # Execution result/details

    # Relationships
    trigger = relationship("Trigger", back_populates="executions")

    # Indexes
    __table_args__ = (
        Index("ix_trigger_executions_trigger_fired", "trigger_id", "fired_at"),
        Index("ix_trigger_executions_status", "status"),
    )

    def __repr__(self) -> str:
        return f"TriggerExecution(id={self.id}, trigger_id={self.trigger_id}, status={self.status})"
