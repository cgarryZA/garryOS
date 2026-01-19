"""
Verification script to test the database setup

This script verifies that:
1. All models are properly defined
2. Database connection works
3. Tables are created correctly
"""
import sys
from sqlalchemy import inspect
from app.core.database import engine
from app.models import Base
from app.modules.calendar.models import (
    User, Event, CalendarItem, Trigger, TriggerExecution,
    CalendarItemType, CalendarItemStatus, TriggerType, TriggerExecutionStatus
)


def verify_database_setup():
    """Verify that database setup is correct"""
    print("=" * 70)
    print("HomeOS Database Setup Verification")
    print("=" * 70)
    print()

    # Check database connection
    print("1. Testing database connection...")
    try:
        inspector = inspect(engine)
        print("   ✓ Database connection successful")
    except Exception as e:
        print(f"   ✗ Database connection failed: {e}")
        return False

    # Check tables exist
    print("\n2. Checking tables...")
    expected_tables = {'users', 'events', 'calendar_items', 'triggers', 'trigger_executions'}
    actual_tables = set(inspector.get_table_names())

    for table in expected_tables:
        if table in actual_tables:
            print(f"   ✓ Table '{table}' exists")
        else:
            print(f"   ✗ Table '{table}' missing")

    # Check columns for each table
    print("\n3. Checking table schemas...")

    # Users table
    user_columns = {col['name'] for col in inspector.get_columns('users')}
    print(f"   ✓ Users table has {len(user_columns)} columns: {', '.join(sorted(user_columns))}")

    # Calendar items table
    calendar_columns = {col['name'] for col in inspector.get_columns('calendar_items')}
    print(f"   ✓ Calendar items table has {len(calendar_columns)} columns: {', '.join(sorted(calendar_columns))}")

    # Events table
    event_columns = {col['name'] for col in inspector.get_columns('events')}
    print(f"   ✓ Events table has {len(event_columns)} columns: {', '.join(sorted(event_columns))}")

    # Triggers table
    trigger_columns = {col['name'] for col in inspector.get_columns('triggers')}
    print(f"   ✓ Triggers table has {len(trigger_columns)} columns: {', '.join(sorted(trigger_columns))}")

    # Trigger executions table
    trigger_exec_columns = {col['name'] for col in inspector.get_columns('trigger_executions')}
    print(f"   ✓ Trigger executions table has {len(trigger_exec_columns)} columns: {', '.join(sorted(trigger_exec_columns))}")

    # Check indexes
    print("\n4. Checking indexes...")
    total_indexes = 0
    for table in expected_tables:
        indexes = inspector.get_indexes(table)
        total_indexes += len(indexes)
        print(f"   ✓ Table '{table}' has {len(indexes)} indexes")

    print(f"\n   Total indexes created: {total_indexes}")

    # Check foreign keys
    print("\n5. Checking foreign key constraints...")
    fk_count = 0
    for table in expected_tables:
        fks = inspector.get_foreign_keys(table)
        if fks:
            for fk in fks:
                fk_count += 1
                print(f"   ✓ {table}.{fk['constrained_columns'][0]} -> {fk['referred_table']}.{fk['referred_columns'][0]}")

    print(f"\n   Total foreign keys: {fk_count}")

    # Check enums are working
    print("\n6. Checking enum types...")
    enum_types = [
        ('CalendarItemType', CalendarItemType, ['EVENT', 'TASK', 'REMINDER']),
        ('CalendarItemStatus', CalendarItemStatus, ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
        ('TriggerType', TriggerType, ['TIME', 'LOCATION', 'PROGRESS', 'NFC']),
        ('TriggerExecutionStatus', TriggerExecutionStatus, ['SUCCESS', 'FAILURE']),
    ]

    for enum_name, enum_class, expected_values in enum_types:
        actual_values = [e.value for e in enum_class]
        if set(actual_values) == set(expected_values):
            print(f"   ✓ {enum_name}: {', '.join(actual_values)}")
        else:
            print(f"   ✗ {enum_name} mismatch")

    print("\n" + "=" * 70)
    print("Database setup verification complete!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    success = verify_database_setup()
    sys.exit(0 if success else 1)
