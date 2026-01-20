"""
Calendar module business logic - service layer for calendar operations
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.modules.calendar.models import CalendarItem, Trigger, TriggerExecution, User
from app.modules.calendar.schemas import (
    CalendarItemCreate,
    CalendarItemUpdate,
    TriggerCreate,
)
from app.core.events import event_bus, EventTypes
from app.core.scheduler import scheduler


class CalendarService:
    """Service layer for calendar items and triggers"""

    @staticmethod
    async def create_item(db: Session, item: CalendarItemCreate, user_id: UUID) -> CalendarItem:
        """Create a new calendar item (event/task/reminder)"""
        db_item = CalendarItem(
            user_id=user_id,
            type=item.type,
            title=item.title,
            description=item.description,
            start_time=item.start_time,
            end_time=item.end_time,
            estimated_duration=item.estimated_duration,
            location=item.location,
            status="pending",
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        # Publish event
        await event_bus.publish(
            EventTypes.ITEM_CREATED,
            {
                "item_id": str(db_item.id),
                "title": db_item.title,
                "type": db_item.type,
                "user_id": str(user_id),
            },
            db=db,
        )

        return db_item

    @staticmethod
    def get_item(db: Session, item_id: UUID, user_id: UUID) -> Optional[CalendarItem]:
        """Get a calendar item by ID"""
        return (
            db.query(CalendarItem)
            .filter(CalendarItem.id == item_id, CalendarItem.user_id == user_id)
            .first()
        )

    @staticmethod
    def list_items(
        db: Session,
        user_id: UUID,
        item_type: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CalendarItem]:
        """List calendar items with optional filters"""
        query = db.query(CalendarItem).filter(CalendarItem.user_id == user_id)

        if item_type:
            query = query.filter(CalendarItem.type == item_type)
        if status:
            query = query.filter(CalendarItem.status == status)

        return query.order_by(CalendarItem.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    async def update_item(
        db: Session, item_id: UUID, user_id: UUID, item_update: CalendarItemUpdate
    ) -> Optional[CalendarItem]:
        """Update a calendar item"""
        db_item = CalendarService.get_item(db, item_id, user_id)
        if not db_item:
            return None

        update_data = item_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)

        db_item.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_item)

        # Publish event
        await event_bus.publish(
            EventTypes.ITEM_UPDATED,
            {
                "item_id": str(db_item.id),
                "title": db_item.title,
                "user_id": str(user_id),
            },
            db=db,
        )

        return db_item

    @staticmethod
    async def complete_item(db: Session, item_id: UUID, user_id: UUID) -> Optional[CalendarItem]:
        """Mark a calendar item as completed and sync with source if applicable"""
        db_item = CalendarService.get_item(db, item_id, user_id)
        if not db_item:
            return None

        db_item.status = "completed"
        db_item.completed_at = datetime.utcnow()
        db_item.progress_percent = 100
        db.commit()
        db.refresh(db_item)

        # Deactivate all triggers for this item
        triggers = db.query(Trigger).filter(Trigger.calendar_item_id == item_id).all()
        for trigger in triggers:
            trigger.is_active = False
        db.commit()

        # Two-way sync: if this is a coursework task, update coursework status
        if db_item.source_type == 'coursework' and db_item.source_id:
            from app.modules.degrees.models import Coursework, CourseworkStatus
            coursework = db.query(Coursework).filter(Coursework.id == db_item.source_id).first()
            if coursework and coursework.status not in [CourseworkStatus.SUBMITTED, CourseworkStatus.GRADED]:
                coursework.status = CourseworkStatus.SUBMITTED
                coursework.submitted_at = datetime.utcnow()
                db.commit()

                # Publish sync event
                await event_bus.publish(
                    EventTypes.ITEM_UPDATED,
                    {
                        "item_id": str(db_item.id),
                        "title": db_item.title,
                        "user_id": str(user_id),
                        "sync_action": "coursework_submitted",
                        "coursework_id": db_item.source_id,
                    },
                    db=db,
                )

        # Publish event
        await event_bus.publish(
            EventTypes.ITEM_COMPLETED,
            {
                "item_id": str(db_item.id),
                "title": db_item.title,
                "user_id": str(user_id),
            },
            db=db,
        )

        return db_item

    @staticmethod
    async def delete_item(db: Session, item_id: UUID, user_id: UUID) -> bool:
        """Delete a calendar item and its triggers"""
        db_item = CalendarService.get_item(db, item_id, user_id)
        if not db_item:
            return False

        # Delete associated triggers (cascade will handle executions)
        db.query(Trigger).filter(Trigger.calendar_item_id == item_id).delete()

        db.delete(db_item)
        db.commit()

        # Publish event
        await event_bus.publish(
            EventTypes.ITEM_DELETED,
            {
                "item_id": str(item_id),
                "user_id": str(user_id),
            },
            db=db,
        )

        return True

    @staticmethod
    async def create_trigger(
        db: Session, calendar_item_id: UUID, trigger: TriggerCreate, user_id: UUID
    ) -> Trigger:
        """Create a new trigger for a calendar item"""
        # Verify item exists and belongs to user
        item = CalendarService.get_item(db, calendar_item_id, user_id)
        if not item:
            raise ValueError("Calendar item not found")

        db_trigger = Trigger(
            calendar_item_id=calendar_item_id,
            trigger_type=trigger.trigger_type,
            trigger_config=trigger.trigger_config,
            is_active=True,
        )
        db.add(db_trigger)
        db.commit()
        db.refresh(db_trigger)

        # Schedule if it's a time-based trigger
        if trigger.trigger_type == "time" and "fire_at" in trigger.trigger_config:
            fire_at = datetime.fromisoformat(
                trigger.trigger_config["fire_at"].replace("Z", "+00:00")
            )
            scheduler.schedule_trigger(str(db_trigger.id), fire_at)

        # Publish event
        await event_bus.publish(
            EventTypes.TRIGGER_CREATED,
            {
                "trigger_id": str(db_trigger.id),
                "calendar_item_id": str(calendar_item_id),
                "trigger_type": trigger.trigger_type,
                "user_id": str(user_id),
            },
            db=db,
        )

        return db_trigger

    @staticmethod
    def get_triggers(db: Session, calendar_item_id: UUID, user_id: UUID) -> List[Trigger]:
        """Get all triggers for a calendar item"""
        # Verify item belongs to user
        item = CalendarService.get_item(db, calendar_item_id, user_id)
        if not item:
            return []

        return db.query(Trigger).filter(Trigger.calendar_item_id == calendar_item_id).all()

    @staticmethod
    async def delete_trigger(db: Session, trigger_id: UUID, user_id: UUID) -> bool:
        """Delete a trigger"""
        trigger = db.query(Trigger).filter(Trigger.id == trigger_id).first()
        if not trigger:
            return False

        # Verify trigger's item belongs to user
        item = CalendarService.get_item(db, trigger.calendar_item_id, user_id)
        if not item:
            return False

        # Cancel from scheduler
        scheduler.cancel_trigger(str(trigger_id))

        db.delete(trigger)
        db.commit()

        # Publish event
        await event_bus.publish(
            EventTypes.TRIGGER_DELETED,
            {
                "trigger_id": str(trigger_id),
                "user_id": str(user_id),
            },
            db=db,
        )

        return True

    @staticmethod
    def get_or_create_user(db: Session, email: str = "default@homeos.local") -> User:
        """Get or create default user (single-user system for now)"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
