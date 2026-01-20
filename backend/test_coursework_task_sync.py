#!/usr/bin/env python3
"""
Test script for coursework-task two-way sync functionality
"""
import asyncio
from datetime import datetime, timedelta
from app.core.database import SessionLocal
from app.modules.calendar.service import CalendarService
from app.modules.degrees.service import DegreeService
from app.modules.degrees.schemas import (
    DegreeProgramCreate,
    ModuleCreate,
    CourseworkCreate,
    CourseworkUpdate,
)
from app.modules.calendar.models import CalendarItemStatus
from app.modules.degrees.models import CourseworkStatus


async def test_coursework_task_sync():
    """Test the two-way sync between coursework and tasks"""
    db = SessionLocal()

    try:
        print("=" * 60)
        print("COURSEWORK-TASK TWO-WAY SYNC TEST")
        print("=" * 60)

        # Get or create user
        user = CalendarService.get_or_create_user(db)
        print(f"\n✓ User created/retrieved: {user.id}")

        # Create degree program
        program_data = DegreeProgramCreate(
            name="BSc Computer Science",
            institution="Test University",
            target_grade=70.0,
            total_credits_required=360
        )
        program = DegreeService.create_program(db, program_data, user.id)
        print(f"✓ Degree program created: {program.name} (ID: {program.id})")

        # Create module
        module_data = ModuleCreate(
            code="CS101",
            name="Introduction to Programming",
            credits=10,
            weighting=8.33,
            semester=1,
            academic_year="2023/2024"
        )
        module = DegreeService.create_module(db, program.id, user.id, module_data)
        print(f"✓ Module created: {module.code} - {module.name} (ID: {module.id})")

        # Test 1: Create coursework with deadline (should auto-create task)
        print("\n" + "-" * 60)
        print("TEST 1: Creating coursework with deadline")
        print("-" * 60)

        deadline = datetime.utcnow() + timedelta(days=14)
        coursework_data = CourseworkCreate(
            name="Midterm Exam",
            weighting=40.0,
            max_marks=100.0,
            deadline=deadline
        )
        coursework = await DegreeService.create_coursework(db, module.id, coursework_data)
        print(f"✓ Coursework created: {coursework.name}")
        print(f"  - Deadline: {coursework.deadline}")
        print(f"  - Linked task ID: {coursework.linked_task_id}")

        if coursework.linked_task_id:
            from app.modules.calendar.models import CalendarItem
            task = db.query(CalendarItem).filter(CalendarItem.id == coursework.linked_task_id).first()
            print(f"✓ Linked task created automatically:")
            print(f"  - Title: {task.title}")
            print(f"  - Start: {task.start_time}")
            print(f"  - End (deadline): {task.end_time}")
            print(f"  - Status: {task.status}")
            print(f"  - Source: {task.source_type}/{task.source_id}")
        else:
            print("✗ ERROR: No linked task was created!")

        # Test 2: Update coursework status to SUBMITTED (should complete task)
        print("\n" + "-" * 60)
        print("TEST 2: Marking coursework as submitted")
        print("-" * 60)

        update_data = CourseworkUpdate(status=CourseworkStatus.SUBMITTED.value)
        coursework = await DegreeService.update_coursework(db, coursework.id, update_data)
        print(f"✓ Coursework status updated to: {coursework.status}")
        print(f"  - Submitted at: {coursework.submitted_at}")

        if coursework.linked_task_id:
            from app.modules.calendar.models import CalendarItem
            task = db.query(CalendarItem).filter(CalendarItem.id == coursework.linked_task_id).first()
            print(f"✓ Linked task status:")
            print(f"  - Status: {task.status}")
            print(f"  - Completed at: {task.completed_at}")
            print(f"  - Progress: {task.progress_percent}%")

            if task.status == CalendarItemStatus.COMPLETED:
                print("  ✓ Task was automatically marked as completed!")
            else:
                print("  ✗ ERROR: Task was not marked as completed!")

        # Test 3: Create coursework without deadline (should NOT create task)
        print("\n" + "-" * 60)
        print("TEST 3: Creating coursework without deadline")
        print("-" * 60)

        coursework_data2 = CourseworkCreate(
            name="Assignment 1",
            weighting=20.0,
            max_marks=100.0
        )
        coursework2 = await DegreeService.create_coursework(db, module.id, coursework_data2)
        print(f"✓ Coursework created: {coursework2.name}")
        print(f"  - Deadline: {coursework2.deadline}")
        print(f"  - Linked task ID: {coursework2.linked_task_id}")

        if not coursework2.linked_task_id:
            print("  ✓ No task created (as expected)")
        else:
            print("  ✗ ERROR: Task was created when it shouldn't have been!")

        # Test 4: Add grades (should complete task)
        print("\n" + "-" * 60)
        print("TEST 4: Adding grades to coursework")
        print("-" * 60)

        # Create new coursework with deadline
        coursework_data3 = CourseworkCreate(
            name="Final Project",
            weighting=40.0,
            max_marks=100.0,
            deadline=datetime.utcnow() + timedelta(days=30)
        )
        coursework3 = await DegreeService.create_coursework(db, module.id, coursework_data3)
        print(f"✓ Coursework created: {coursework3.name}")

        # Add grades
        update_data3 = CourseworkUpdate(achieved_marks=85.0, feedback="Excellent work!")
        coursework3 = await DegreeService.update_coursework(db, coursework3.id, update_data3)
        print(f"✓ Grades added: {coursework3.achieved_marks}/{coursework3.max_marks}")
        print(f"  - Status: {coursework3.status}")

        if coursework3.linked_task_id:
            from app.modules.calendar.models import CalendarItem
            task = db.query(CalendarItem).filter(CalendarItem.id == coursework3.linked_task_id).first()
            print(f"✓ Linked task status:")
            print(f"  - Status: {task.status}")

            if task.status == CalendarItemStatus.COMPLETED:
                print("  ✓ Task was automatically marked as completed when graded!")
            else:
                print("  ✗ ERROR: Task was not marked as completed when graded!")

        # Test 5: Two-way sync - complete task (should mark coursework as submitted)
        print("\n" + "-" * 60)
        print("TEST 5: Completing task (two-way sync)")
        print("-" * 60)

        # Create new coursework with deadline
        coursework_data4 = CourseworkCreate(
            name="Lab Report",
            weighting=10.0,
            max_marks=100.0,
            deadline=datetime.utcnow() + timedelta(days=7)
        )
        coursework4 = await DegreeService.create_coursework(db, module.id, coursework_data4)
        print(f"✓ Coursework created: {coursework4.name}")
        print(f"  - Initial status: {coursework4.status}")

        # Complete the task via CalendarService
        task_id = coursework4.linked_task_id
        await CalendarService.complete_item(db, task_id, user.id)
        print(f"✓ Task marked as completed via CalendarService")

        # Refresh coursework to see if status changed
        db.refresh(coursework4)
        print(f"✓ Coursework status after task completion:")
        print(f"  - Status: {coursework4.status}")
        print(f"  - Submitted at: {coursework4.submitted_at}")

        if coursework4.status == CourseworkStatus.SUBMITTED:
            print("  ✓ Coursework was automatically marked as submitted!")
        else:
            print("  ✗ ERROR: Coursework was not marked as submitted!")

        # Test 6: Delete coursework (should delete linked task)
        print("\n" + "-" * 60)
        print("TEST 6: Deleting coursework with linked task")
        print("-" * 60)

        # Create new coursework with deadline
        coursework_data5 = CourseworkCreate(
            name="Quiz 1",
            weighting=5.0,
            max_marks=50.0,
            deadline=datetime.utcnow() + timedelta(days=3)
        )
        coursework5 = await DegreeService.create_coursework(db, module.id, coursework_data5)
        task_id5 = coursework5.linked_task_id
        print(f"✓ Coursework created: {coursework5.name}")
        print(f"  - Linked task ID: {task_id5}")

        # Delete coursework
        await DegreeService.delete_coursework(db, coursework5.id)
        print(f"✓ Coursework deleted")

        # Check if task was also deleted
        from app.modules.calendar.models import CalendarItem
        task = db.query(CalendarItem).filter(CalendarItem.id == task_id5).first()
        if task is None:
            print("  ✓ Linked task was automatically deleted!")
        else:
            print("  ✗ ERROR: Linked task was not deleted!")

        print("\n" + "=" * 60)
        print("ALL TESTS COMPLETED")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_coursework_task_sync())
