"""
Calendar module API router - endpoints for calendar operations
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.modules.calendar.schemas import (
    CalendarItemCreate,
    CalendarItemUpdate,
    CalendarItemResponse,
    TriggerCreate,
    TriggerResponse,
)
from app.modules.calendar.service import CalendarService

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


def get_current_user_id(db: Session = Depends(get_db)) -> UUID:
    """Get current user ID (single-user system for now)"""
    user = CalendarService.get_or_create_user(db)
    return user.id


# Calendar Items Endpoints


@router.post("/items", response_model=CalendarItemResponse, status_code=201)
async def create_calendar_item(
    item: CalendarItemCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Create a new calendar item (event, task, or reminder).

    - **type**: 'event', 'task', or 'reminder'
    - **title**: Title of the item (required)
    - **description**: Optional description
    - **start_time**: Optional start time
    - **end_time**: Optional end time
    - **estimated_duration**: Estimated duration in minutes
    - **location**: Location text
    """
    return await CalendarService.create_item(db, item, user_id)


@router.get("/items", response_model=List[CalendarItemResponse])
async def list_calendar_items(
    type: Optional[str] = Query(None, description="Filter by type: event, task, or reminder"),
    status: Optional[str] = Query(None, description="Filter by status: pending, active, completed, cancelled"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=500, description="Max number of items to return"),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    List calendar items with optional filters.

    - Filter by **type** (event/task/reminder)
    - Filter by **status** (pending/active/completed/cancelled)
    - Paginate with **skip** and **limit**
    """
    return CalendarService.list_items(db, user_id, type, status, skip, limit)


@router.get("/items/{item_id}", response_model=CalendarItemResponse)
async def get_calendar_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Get a specific calendar item by ID"""
    item = CalendarService.get_item(db, item_id, user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Calendar item not found")
    return item


@router.put("/items/{item_id}", response_model=CalendarItemResponse)
async def update_calendar_item(
    item_id: UUID,
    item_update: CalendarItemUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Update a calendar item.

    Only provided fields will be updated (partial update).
    """
    item = await CalendarService.update_item(db, item_id, user_id, item_update)
    if not item:
        raise HTTPException(status_code=404, detail="Calendar item not found")
    return item


@router.post("/items/{item_id}/complete", response_model=CalendarItemResponse)
async def complete_calendar_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Mark a calendar item as completed.

    - Sets status to 'completed'
    - Sets completed_at timestamp
    - Sets progress_percent to 100
    - Deactivates all triggers
    """
    item = await CalendarService.complete_item(db, item_id, user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Calendar item not found")
    return item


@router.delete("/items/{item_id}", status_code=204)
async def delete_calendar_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Delete a calendar item and all associated triggers.

    This cannot be undone.
    """
    success = await CalendarService.delete_item(db, item_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Calendar item not found")
    return None


# Trigger Endpoints


@router.post("/items/{item_id}/triggers", response_model=TriggerResponse, status_code=201)
async def create_trigger(
    item_id: UUID,
    trigger: TriggerCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Create a trigger (reminder) for a calendar item.

    **Time-based trigger example:**
    ```json
    {
      "trigger_type": "time",
      "trigger_config": {
        "fire_at": "2024-01-20T10:00:00Z",
        "repeat": false
      }
    }
    ```

    **Location-based trigger example (future):**
    ```json
    {
      "trigger_type": "location",
      "trigger_config": {
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius_meters": 100
      }
    }
    ```
    """
    try:
        return await CalendarService.create_trigger(db, item_id, trigger, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/items/{item_id}/triggers", response_model=List[TriggerResponse])
async def list_triggers(
    item_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Get all triggers for a calendar item"""
    return CalendarService.get_triggers(db, item_id, user_id)


@router.delete("/triggers/{trigger_id}", status_code=204)
async def delete_trigger(
    trigger_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Delete a trigger.

    This will cancel the scheduled reminder.
    """
    success = await CalendarService.delete_trigger(db, trigger_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Trigger not found")
    return None
