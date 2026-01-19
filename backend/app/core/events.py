"""
Event bus system for HomeOS - simple pub/sub pattern for inter-module communication
"""
from typing import Dict, List, Callable, Any
from datetime import datetime
import asyncio
import logging
from sqlalchemy.orm import Session
from uuid import uuid4

logger = logging.getLogger(__name__)


class EventBus:
    """
    Simple event bus for publishing and subscribing to events.
    Events are both stored in the database and propagated to subscribers in real-time.
    """

    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
        self._event_history: List[Dict[str, Any]] = []

    def subscribe(self, event_type: str, handler: Callable):
        """
        Subscribe to an event type with a handler function.

        Args:
            event_type: The type of event to listen for (e.g., "item.created", "trigger.fired")
            handler: Async or sync function to call when event is published
        """
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)
        logger.info(f"Subscribed to event: {event_type}")

    def unsubscribe(self, event_type: str, handler: Callable):
        """
        Unsubscribe a handler from an event type.
        """
        if event_type in self._subscribers:
            self._subscribers[event_type].remove(handler)
            logger.info(f"Unsubscribed from event: {event_type}")

    async def publish(self, event_type: str, payload: Dict[str, Any], db: Session = None):
        """
        Publish an event to all subscribers and optionally store in database.

        Args:
            event_type: The type of event (e.g., "item.created", "trigger.fired")
            payload: Event data
            db: Optional database session to persist event
        """
        event = {
            "id": str(uuid4()),
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Store in memory history (keep last 1000 events)
        self._event_history.append(event)
        if len(self._event_history) > 1000:
            self._event_history.pop(0)

        # Store in database if session provided
        if db:
            try:
                from app.modules.calendar.models import Event
                db_event = Event(
                    type=event_type,
                    payload=payload,
                    user_id=payload.get("user_id")  # Extract user_id if present
                )
                db.add(db_event)
                db.commit()
            except Exception as e:
                logger.error(f"Failed to store event in database: {e}")
                db.rollback()

        # Notify all subscribers
        if event_type in self._subscribers:
            logger.info(f"Publishing event: {event_type} to {len(self._subscribers[event_type])} subscribers")
            for handler in self._subscribers[event_type]:
                try:
                    # Handle both sync and async handlers
                    if asyncio.iscoroutinefunction(handler):
                        await handler(event)
                    else:
                        handler(event)
                except Exception as e:
                    logger.error(f"Error in event handler for {event_type}: {e}")
        else:
            logger.debug(f"No subscribers for event: {event_type}")

    def get_history(self, event_type: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get event history, optionally filtered by type.
        """
        if event_type:
            filtered = [e for e in self._event_history if e["type"] == event_type]
            return filtered[-limit:]
        return self._event_history[-limit:]


# Global event bus instance
event_bus = EventBus()


# Event type constants
class EventTypes:
    """Standard event types used across the system"""
    ITEM_CREATED = "item.created"
    ITEM_UPDATED = "item.updated"
    ITEM_DELETED = "item.deleted"
    ITEM_COMPLETED = "item.completed"

    TRIGGER_CREATED = "trigger.created"
    TRIGGER_FIRED = "trigger.fired"
    TRIGGER_DELETED = "trigger.deleted"

    NOTIFICATION_SENT = "notification.sent"
