"""
Task scheduler for HomeOS - manages time-based triggers and background jobs
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from typing import Dict, Any
import logging

from app.core.events import event_bus, EventTypes
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


class TriggerScheduler:
    """
    Manages scheduled triggers and background jobs using APScheduler.
    """

    def __init__(self):
        jobstores = {"default": MemoryJobStore()}
        self.scheduler = AsyncIOScheduler(jobstores=jobstores, timezone="UTC")
        self._trigger_jobs: Dict[str, str] = {}  # trigger_id -> job_id mapping

    def start(self):
        """Start the scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("🕐 Scheduler started")

            # Add periodic trigger check job (runs every minute)
            self.scheduler.add_job(
                func=self._check_due_triggers,
                trigger=IntervalTrigger(minutes=1),
                id="check_triggers",
                name="Check for due triggers",
                replace_existing=True,
            )
            logger.info("Added periodic trigger check job (every 1 minute)")

    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler shut down")

    async def _check_due_triggers(self):
        """
        Periodic job that checks for triggers that are due to fire.
        This runs every minute and finds triggers that should be executed.
        """
        logger.debug("Checking for due triggers...")
        db = SessionLocal()
        try:
            from app.modules.calendar.models import Trigger, TriggerExecution
            from datetime import datetime, timedelta

            # Find active time-based triggers
            now = datetime.utcnow()
            triggers = (
                db.query(Trigger)
                .filter(
                    Trigger.is_active == True,
                    Trigger.trigger_type == "time",
                )
                .all()
            )

            for trigger in triggers:
                try:
                    config = trigger.trigger_config
                    fire_at = config.get("fire_at")

                    if fire_at:
                        fire_time = datetime.fromisoformat(fire_at.replace("Z", "+00:00"))

                        # Fire if it's time and hasn't been fired yet (or repeating)
                        if fire_time <= now:
                            # Check if already fired (for one-time triggers)
                            is_repeat = config.get("repeat", False)

                            if not trigger.last_fired_at or is_repeat:
                                await self._fire_trigger(trigger.id, db)

                except Exception as e:
                    logger.error(f"Error processing trigger {trigger.id}: {e}")

        except Exception as e:
            logger.error(f"Error in _check_due_triggers: {e}")
        finally:
            db.close()

    async def _fire_trigger(self, trigger_id: str, db):
        """
        Fire a trigger - create execution record and publish event.
        """
        from app.modules.calendar.models import Trigger, TriggerExecution, CalendarItem

        try:
            trigger = db.query(Trigger).filter(Trigger.id == trigger_id).first()
            if not trigger:
                logger.error(f"Trigger {trigger_id} not found")
                return

            # Get the associated calendar item
            calendar_item = (
                db.query(CalendarItem)
                .filter(CalendarItem.id == trigger.calendar_item_id)
                .first()
            )

            if not calendar_item:
                logger.error(f"Calendar item {trigger.calendar_item_id} not found")
                return

            logger.info(f"🔔 Firing trigger {trigger.id} for item: {calendar_item.title}")

            # Create execution record
            execution = TriggerExecution(
                trigger_id=trigger.id,
                status="success",
                result={
                    "message": f"Reminder for: {calendar_item.title}",
                    "calendar_item_id": str(calendar_item.id),
                    "title": calendar_item.title,
                    "description": calendar_item.description,
                },
            )
            db.add(execution)

            # Update trigger last_fired_at
            trigger.last_fired_at = datetime.utcnow()

            # If not repeating, deactivate
            if not trigger.trigger_config.get("repeat", False):
                trigger.is_active = False

            db.commit()

            # Publish event for notifications
            await event_bus.publish(
                EventTypes.TRIGGER_FIRED,
                {
                    "trigger_id": str(trigger.id),
                    "calendar_item_id": str(calendar_item.id),
                    "title": calendar_item.title,
                    "description": calendar_item.description,
                    "user_id": str(calendar_item.user_id),
                },
                db=db,
            )

            logger.info(f"Successfully fired trigger {trigger.id}")

        except Exception as e:
            logger.error(f"Error firing trigger {trigger_id}: {e}")
            db.rollback()

            # Create failed execution record
            try:
                execution = TriggerExecution(
                    trigger_id=trigger_id,
                    status="failure",
                    result={"error": str(e)},
                )
                db.add(execution)
                db.commit()
            except:
                pass

    def schedule_trigger(self, trigger_id: str, fire_at: datetime):
        """
        Schedule a specific trigger to fire at a given time.
        Note: This is for immediate scheduling. The periodic check handles most triggers.
        """
        try:
            job = self.scheduler.add_job(
                func=self._fire_trigger,
                trigger=DateTrigger(run_date=fire_at),
                args=[trigger_id, SessionLocal()],
                id=f"trigger_{trigger_id}",
                name=f"Trigger {trigger_id}",
                replace_existing=True,
            )
            self._trigger_jobs[trigger_id] = job.id
            logger.info(f"Scheduled trigger {trigger_id} to fire at {fire_at}")
        except Exception as e:
            logger.error(f"Error scheduling trigger {trigger_id}: {e}")

    def cancel_trigger(self, trigger_id: str):
        """Cancel a scheduled trigger"""
        job_id = self._trigger_jobs.get(trigger_id)
        if job_id:
            try:
                self.scheduler.remove_job(job_id)
                del self._trigger_jobs[trigger_id]
                logger.info(f"Cancelled trigger {trigger_id}")
            except Exception as e:
                logger.error(f"Error cancelling trigger {trigger_id}: {e}")


# Global scheduler instance
scheduler = TriggerScheduler()
