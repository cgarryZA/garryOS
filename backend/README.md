# HomeOS Backend - Database Setup

Complete database schema for HomeOS, a local-first personal operating system.

## Overview

This backend implements a comprehensive database schema using SQLAlchemy ORM with Alembic migrations. The schema supports calendar items (events, tasks, reminders), triggers (time, location, progress, NFC), and event logging.

## Database Structure

### Tables

1. **users** - User authentication and ownership
   - `id` (UUID, PK)
   - `email` (String, unique)
   - `created_at` (DateTime)

2. **events** - Event logging for system events and user actions
   - `id` (UUID, PK)
   - `user_id` (UUID, FK → users.id)
   - `type` (String)
   - `payload` (JSON)
   - `created_at` (DateTime)

3. **calendar_items** - Unified calendar items (events, tasks, reminders)
   - `id` (UUID, PK)
   - `user_id` (UUID, FK → users.id)
   - `type` (Enum: event, task, reminder)
   - `title` (String, required)
   - `description` (Text, nullable)
   - `start_time` (DateTime, nullable)
   - `end_time` (DateTime, nullable)
   - `estimated_duration` (Integer minutes, nullable)
   - `progress_percent` (Integer 0-100, default 0)
   - `recurrence_rule` (String RRULE format, nullable)
   - `location` (String, nullable)
   - `status` (Enum: pending, active, completed, cancelled)
   - `completed_at` (DateTime, nullable)
   - `created_at`, `updated_at` (DateTime)

4. **triggers** - Event triggers based on various conditions
   - `id` (UUID, PK)
   - `calendar_item_id` (UUID, FK → calendar_items.id)
   - `trigger_type` (Enum: time, location, progress, nfc)
   - `trigger_config` (JSON) - Type-specific configuration
   - `last_fired_at` (DateTime, nullable)
   - `is_active` (Boolean, default true)
   - `created_at` (DateTime)

5. **trigger_executions** - Log of trigger executions
   - `id` (UUID, PK)
   - `trigger_id` (UUID, FK → triggers.id)
   - `fired_at` (DateTime)
   - `status` (Enum: success, failure)
   - `result` (JSON, nullable)
   - `created_at` (DateTime)

## Features

- **UUID Primary Keys**: All tables use UUID for better distributed system support
- **Proper Indexing**: Optimized indexes for common query patterns
- **Foreign Key Constraints**: Cascade delete for data integrity
- **Check Constraints**: Data validation at database level
- **Enum Types**: Type-safe enums for status and type fields
- **JSON Support**: Flexible storage for configurations and results
- **Timestamps**: Automatic created_at and updated_at tracking

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Migrations

```bash
# Run all migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Check current migration status
alembic current
```

### 3. Verify Setup

```bash
python verify_setup.py
```

## File Structure

```
backend/
├── alembic/                    # Alembic migration files
│   ├── versions/              # Migration version files
│   ├── env.py                 # Alembic environment config
│   └── script.py.mako         # Migration template
├── app/
│   ├── models.py              # Base SQLAlchemy model
│   ├── core/
│   │   └── database.py        # Database configuration
│   └── modules/
│       └── calendar/
│           ├── models.py      # Calendar SQLAlchemy models
│           └── schemas.py     # Pydantic validation schemas
├── alembic.ini                # Alembic configuration
├── requirements.txt           # Python dependencies
└── verify_setup.py           # Database verification script
```

## Usage Examples

### Creating a User

```python
from app.core.database import SessionLocal
from app.modules.calendar.models import User

db = SessionLocal()
user = User(email="user@example.com")
db.add(user)
db.commit()
```

### Creating a Calendar Item

```python
from app.modules.calendar.models import CalendarItem, CalendarItemType, CalendarItemStatus
from datetime import datetime, timedelta

# Create an event
event = CalendarItem(
    user_id=user.id,
    type=CalendarItemType.EVENT,
    title="Team Meeting",
    description="Weekly sync meeting",
    start_time=datetime.now() + timedelta(days=1),
    end_time=datetime.now() + timedelta(days=1, hours=1),
    location="Conference Room A",
    status=CalendarItemStatus.PENDING
)
db.add(event)
db.commit()
```

### Creating a Trigger

```python
from app.modules.calendar.models import Trigger, TriggerType

# Create a time-based trigger
trigger = Trigger(
    calendar_item_id=event.id,
    trigger_type=TriggerType.TIME,
    trigger_config={
        "time": "2024-01-20T09:00:00",
        "remind_minutes_before": 15
    },
    is_active=True
)
db.add(trigger)
db.commit()
```

## Pydantic Schemas

All models have corresponding Pydantic schemas for validation:

- **UserCreate**, **UserResponse**
- **EventCreate**, **EventResponse**
- **CalendarItemCreate**, **CalendarItemUpdate**, **CalendarItemResponse**
- **TriggerCreate**, **TriggerUpdate**, **TriggerResponse**
- **TriggerExecutionCreate**, **TriggerExecutionResponse**

### Example with Pydantic

```python
from app.modules.calendar.schemas import CalendarItemCreate

# Validates the data before creating
item_data = CalendarItemCreate(
    user_id=user.id,
    type="event",
    title="Meeting",
    start_time=datetime.now(),
    end_time=datetime.now() + timedelta(hours=1)
)

# Convert to SQLAlchemy model
calendar_item = CalendarItem(**item_data.model_dump())
```

## Trigger Configuration Examples

### Time Trigger
```json
{
  "time": "2024-01-20T09:00:00",
  "cron": "0 9 * * 1-5"  // Alternative: cron expression
}
```

### Location Trigger
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "radius_meters": 100,
  "trigger_on": "enter"  // or "exit"
}
```

### Progress Trigger
```json
{
  "threshold_percent": 75,
  "trigger_once": true
}
```

### NFC Trigger
```json
{
  "tag_id": "04:E8:D5:12:34:56:78",
  "action": "complete_task"
}
```

## Database URL Configuration

Edit `alembic.ini` to change the database:

```ini
# SQLite (default - local-first)
sqlalchemy.url = sqlite:///./homeos.db

# PostgreSQL (for production)
sqlalchemy.url = postgresql://user:password@localhost/homeos
```

Also update `/backend/app/core/database.py`:

```python
# For PostgreSQL, remove the connect_args parameter
engine = create_engine(
    DATABASE_URL,
    echo=True
)
```

## Creating New Migrations

When you modify models:

```bash
# Generate migration automatically
alembic revision --autogenerate -m "Description of changes"

# Review the generated migration file
# Apply the migration
alembic upgrade head
```

## Best Practices

1. Always use Pydantic schemas for API validation
2. Use the `get_db()` dependency in FastAPI endpoints
3. Never modify migration files after they've been applied
4. Use proper indexes for frequently queried fields
5. Leverage JSON fields for flexible, schema-free data
6. Set appropriate cascade rules for foreign keys

## License

Part of the HomeOS project.
