"""
Pydantic schemas for calendar module

Provides request/response validation and serialization
"""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, ConfigDict

from app.modules.calendar.models import (
    CalendarItemType,
    CalendarItemStatus,
    TriggerType,
    TriggerExecutionStatus,
)


# ============================================================================
# User Schemas
# ============================================================================

class UserBase(BaseModel):
    """Base user schema"""
    email: str = Field(..., max_length=255, description="User email address")


class UserCreate(UserBase):
    """Schema for creating a user"""
    pass


class UserResponse(UserBase):
    """Schema for user responses"""
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Event Schemas
# ============================================================================

class EventBase(BaseModel):
    """Base event schema"""
    type: str = Field(..., max_length=100, description="Event type")
    payload: Optional[dict[str, Any]] = Field(None, description="Event payload data")


class EventCreate(EventBase):
    """Schema for creating an event"""
    user_id: UUID


class EventResponse(EventBase):
    """Schema for event responses"""
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Calendar Item Schemas
# ============================================================================

class CalendarItemBase(BaseModel):
    """Base calendar item schema"""
    type: CalendarItemType = Field(..., description="Type of calendar item")
    title: str = Field(..., max_length=500, min_length=1, description="Title of the item")
    description: Optional[str] = Field(None, description="Detailed description")
    start_time: Optional[datetime] = Field(None, description="Start time for events/reminders")
    end_time: Optional[datetime] = Field(None, description="End time for events")
    estimated_duration: Optional[int] = Field(
        None,
        ge=1,
        description="Estimated duration in minutes (for tasks)"
    )
    progress_percent: int = Field(
        0,
        ge=0,
        le=100,
        description="Progress percentage (0-100)"
    )
    recurrence_rule: Optional[str] = Field(
        None,
        max_length=500,
        description="Recurrence rule in RRULE format"
    )
    location: Optional[str] = Field(None, max_length=500, description="Location")
    status: CalendarItemStatus = Field(
        CalendarItemStatus.PENDING,
        description="Current status"
    )
    source_type: Optional[str] = Field(None, max_length=50, description="Source module type")
    source_id: Optional[str] = Field(None, max_length=36, description="Source entity ID")

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: Optional[datetime], info) -> Optional[datetime]:
        """Validate that end_time is after start_time"""
        if v is not None and "start_time" in info.data:
            start_time = info.data.get("start_time")
            if start_time is not None and v <= start_time:
                raise ValueError("end_time must be after start_time")
        return v


class CalendarItemCreate(CalendarItemBase):
    """Schema for creating a calendar item"""
    user_id: UUID

    @field_validator("type")
    @classmethod
    def validate_type_fields(cls, v: CalendarItemType, info) -> CalendarItemType:
        """Validate that required fields are present based on type"""
        # This validator runs before others, so we just validate the type exists
        return v


class CalendarItemUpdate(BaseModel):
    """Schema for updating a calendar item"""
    title: Optional[str] = Field(None, max_length=500, min_length=1)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    estimated_duration: Optional[int] = Field(None, ge=1)
    progress_percent: Optional[int] = Field(None, ge=0, le=100)
    recurrence_rule: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=500)
    status: Optional[CalendarItemStatus] = None
    completed_at: Optional[datetime] = None

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: Optional[datetime], info) -> Optional[datetime]:
        """Validate that end_time is after start_time if both provided"""
        if v is not None and "start_time" in info.data:
            start_time = info.data.get("start_time")
            if start_time is not None and v <= start_time:
                raise ValueError("end_time must be after start_time")
        return v


class CalendarItemResponse(CalendarItemBase):
    """Schema for calendar item responses"""
    id: UUID
    user_id: UUID
    completed_at: Optional[datetime] = None
    source_type: Optional[str] = None
    source_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Trigger Schemas
# ============================================================================

class TriggerBase(BaseModel):
    """Base trigger schema"""
    trigger_type: TriggerType = Field(..., description="Type of trigger")
    trigger_config: dict[str, Any] = Field(..., description="Trigger configuration (type-specific)")
    is_active: bool = Field(True, description="Whether trigger is active")


class TriggerCreate(TriggerBase):
    """Schema for creating a trigger"""
    calendar_item_id: UUID

    @field_validator("trigger_config")
    @classmethod
    def validate_trigger_config(cls, v: dict[str, Any], info) -> dict[str, Any]:
        """Validate trigger_config based on trigger_type"""
        if not v:
            raise ValueError("trigger_config cannot be empty")

        trigger_type = info.data.get("trigger_type")

        if trigger_type == TriggerType.TIME:
            # TIME triggers should have 'time' or 'cron' field
            if "time" not in v and "cron" not in v:
                raise ValueError("TIME trigger requires 'time' (datetime) or 'cron' (expression) in config")

        elif trigger_type == TriggerType.LOCATION:
            # LOCATION triggers should have coordinates and radius
            required = {"latitude", "longitude", "radius_meters"}
            if not required.issubset(v.keys()):
                raise ValueError(f"LOCATION trigger requires {required} in config")

        elif trigger_type == TriggerType.PROGRESS:
            # PROGRESS triggers should have threshold
            if "threshold_percent" not in v:
                raise ValueError("PROGRESS trigger requires 'threshold_percent' in config")
            threshold = v["threshold_percent"]
            if not isinstance(threshold, (int, float)) or not 0 <= threshold <= 100:
                raise ValueError("threshold_percent must be between 0 and 100")

        elif trigger_type == TriggerType.NFC:
            # NFC triggers should have tag_id
            if "tag_id" not in v:
                raise ValueError("NFC trigger requires 'tag_id' in config")

        return v


class TriggerUpdate(BaseModel):
    """Schema for updating a trigger"""
    trigger_config: Optional[dict[str, Any]] = None
    is_active: Optional[bool] = None


class TriggerResponse(TriggerBase):
    """Schema for trigger responses"""
    id: UUID
    calendar_item_id: UUID
    last_fired_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Trigger Execution Schemas
# ============================================================================

class TriggerExecutionBase(BaseModel):
    """Base trigger execution schema"""
    status: TriggerExecutionStatus = Field(..., description="Execution status")
    result: Optional[dict[str, Any]] = Field(None, description="Execution result data")


class TriggerExecutionCreate(TriggerExecutionBase):
    """Schema for creating a trigger execution"""
    trigger_id: UUID
    fired_at: datetime = Field(default_factory=datetime.utcnow)


class TriggerExecutionResponse(TriggerExecutionBase):
    """Schema for trigger execution responses"""
    id: UUID
    trigger_id: UUID
    fired_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
