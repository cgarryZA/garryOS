"""
Degree tracker API router - endpoints for degree tracking
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.modules.calendar.service import CalendarService  # For user management
from app.modules.degrees.schemas import (
    DegreeProgramCreate,
    DegreeProgramUpdate,
    DegreeProgramResponse,
    ModuleCreate,
    ModuleUpdate,
    ModuleResponse,
    CourseworkCreate,
    CourseworkUpdate,
    CourseworkResponse,
    LectureCreate,
    LectureUpdate,
    LectureResponse,
    ModuleStatistics,
    DegreeStatistics,
    TargetGradeCalculation,
)
from app.modules.degrees.service import DegreeService

router = APIRouter(prefix="/api/degrees", tags=["degrees"])


def get_current_user_id(db: Session = Depends(get_db)) -> UUID:
    """Get current user ID (reusing from calendar module)"""
    user = CalendarService.get_or_create_user(db)
    return user.id


# ===== Degree Program Endpoints =====


@router.post("/programs", response_model=DegreeProgramResponse, status_code=201)
async def create_degree_program(
    program: DegreeProgramCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Create a new degree program.

    Example:
    ```json
    {
      "name": "BSc Computer Science",
      "institution": "University of Example",
      "target_grade": 70.0,
      "total_credits_required": 360
    }
    ```
    """
    return DegreeService.create_program(db, program, user_id)


@router.get("/programs", response_model=List[DegreeProgramResponse])
async def list_degree_programs(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """List all degree programs for the current user."""
    return DegreeService.list_programs(db, user_id)


@router.get("/programs/{program_id}", response_model=DegreeProgramResponse)
async def get_degree_program(
    program_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Get a specific degree program by ID."""
    program = DegreeService.get_program(db, program_id, user_id)
    if not program:
        raise HTTPException(status_code=404, detail="Degree program not found")
    return program


@router.put("/programs/{program_id}", response_model=DegreeProgramResponse)
async def update_degree_program(
    program_id: UUID,
    program_update: DegreeProgramUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Update a degree program."""
    program = DegreeService.update_program(db, program_id, user_id, program_update)
    if not program:
        raise HTTPException(status_code=404, detail="Degree program not found")
    return program


@router.delete("/programs/{program_id}", status_code=204)
async def delete_degree_program(
    program_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """Delete a degree program and all associated modules and coursework."""
    success = DegreeService.delete_program(db, program_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Degree program not found")
    return None


# ===== Module Endpoints =====


@router.post("/programs/{program_id}/modules", response_model=ModuleResponse, status_code=201)
async def create_module(
    program_id: UUID,
    module: ModuleCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Create a new module within a degree program.

    Example:
    ```json
    {
      "code": "CS101",
      "name": "Introduction to Programming",
      "credits": 10,
      "weighting": 8.33,
      "semester": 1,
      "academic_year": "2023/2024"
    }
    ```
    """
    try:
        return DegreeService.create_module(db, program_id, user_id, module)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/programs/{program_id}/modules", response_model=List[ModuleResponse])
async def list_modules(
    program_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """List all modules for a degree program."""
    return DegreeService.list_modules(db, program_id, user_id)


@router.get("/modules/{module_id}", response_model=ModuleResponse)
async def get_module(
    module_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a specific module by ID."""
    module = DegreeService.get_module(db, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


@router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: UUID,
    module_update: ModuleUpdate,
    db: Session = Depends(get_db),
):
    """Update a module."""
    module = DegreeService.update_module(db, module_id, module_update)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


@router.delete("/modules/{module_id}", status_code=204)
async def delete_module(
    module_id: UUID,
    db: Session = Depends(get_db),
):
    """Delete a module and all associated coursework."""
    success = DegreeService.delete_module(db, module_id)
    if not success:
        raise HTTPException(status_code=404, detail="Module not found")
    return None


# ===== Coursework Endpoints =====


@router.post("/modules/{module_id}/coursework", response_model=CourseworkResponse, status_code=201)
async def create_coursework(
    module_id: UUID,
    coursework: CourseworkCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new coursework item within a module.

    Example:
    ```json
    {
      "name": "Midterm Exam",
      "weighting": 40.0,
      "max_marks": 100,
      "achieved_marks": 75,
      "deadline": "2024-03-15T09:00:00Z"
    }
    ```
    """
    try:
        return await DegreeService.create_coursework(db, module_id, coursework)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/modules/{module_id}/coursework", response_model=List[CourseworkResponse])
async def list_coursework(
    module_id: UUID,
    db: Session = Depends(get_db),
):
    """List all coursework for a module."""
    return DegreeService.list_coursework(db, module_id)


@router.get("/coursework/{coursework_id}", response_model=CourseworkResponse)
async def get_coursework(
    coursework_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a specific coursework item by ID with linked task status."""
    coursework = DegreeService.get_coursework_with_task_status(db, coursework_id)
    if not coursework:
        raise HTTPException(status_code=404, detail="Coursework not found")
    return coursework


@router.put("/coursework/{coursework_id}", response_model=CourseworkResponse)
async def update_coursework(
    coursework_id: UUID,
    coursework_update: CourseworkUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a coursework item.

    Use this to add marks after grading:
    ```json
    {
      "achieved_marks": 85,
      "feedback": "Excellent work!"
    }
    ```
    """
    coursework = await DegreeService.update_coursework(db, coursework_id, coursework_update)
    if not coursework:
        raise HTTPException(status_code=404, detail="Coursework not found")
    return coursework


@router.delete("/coursework/{coursework_id}", status_code=204)
async def delete_coursework(
    coursework_id: UUID,
    db: Session = Depends(get_db),
):
    """Delete a coursework item and its linked calendar task."""
    success = await DegreeService.delete_coursework(db, coursework_id)
    if not success:
        raise HTTPException(status_code=404, detail="Coursework not found")
    return None


# ===== Statistics & Analytics Endpoints =====


@router.get("/modules/{module_id}/stats", response_model=ModuleStatistics)
async def get_module_statistics(
    module_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Get comprehensive statistics for a module.

    Returns:
    - Current weighted average
    - Completion percentage
    - Best/worst case grades
    - Progress information
    """
    try:
        return DegreeService.calculate_module_stats(db, module_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/programs/{program_id}/stats", response_model=DegreeStatistics)
async def get_degree_statistics(
    program_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Get comprehensive statistics for an entire degree program.

    Returns:
    - Overall degree average
    - Credits completed/remaining
    - Module statistics
    - Best/worst case projections
    - Whether on track for target grade
    """
    try:
        return DegreeService.calculate_degree_stats(db, program_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/programs/{program_id}/target-grade", response_model=TargetGradeCalculation)
async def calculate_target_grade(
    program_id: UUID,
    target_grade: float = Query(..., ge=0, le=100, description="Target grade percentage"),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Calculate what's needed on remaining coursework to achieve a target grade.

    Example: `/api/degrees/programs/{id}/target-grade?target_grade=70.0`

    Returns:
    - Required average on remaining coursework
    - Whether target is still achievable
    - Margin above/below requirement
    """
    try:
        return DegreeService.calculate_target_grade(db, program_id, user_id, target_grade)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ===== Lecture Endpoints =====


@router.post("/modules/{module_id}/lectures", response_model=LectureResponse, status_code=201)
async def create_lecture(
    module_id: UUID,
    lecture: LectureCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new lecture for a module.

    This will automatically generate recurring calendar events for each week
    between recurrence_start_date and recurrence_end_date.

    Example:
    ```json
    {
      "title": "Weekly Lecture",
      "location": "Room 101",
      "day_of_week": 1,
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "recurrence_start_date": "2024-01-08",
      "recurrence_end_date": "2024-05-20",
      "notes": "Bring laptop"
    }
    ```
    """
    try:
        return DegreeService.create_lecture(db, module_id, lecture)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/modules/{module_id}/lectures", response_model=List[LectureResponse])
async def list_lectures(
    module_id: UUID,
    db: Session = Depends(get_db),
):
    """List all lectures for a module."""
    return DegreeService.list_lectures(db, module_id)


@router.get("/lectures/{lecture_id}", response_model=LectureResponse)
async def get_lecture(
    lecture_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a specific lecture by ID."""
    lecture = DegreeService.get_lecture(db, lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@router.put("/lectures/{lecture_id}", response_model=LectureResponse)
async def update_lecture(
    lecture_id: UUID,
    lecture_update: LectureUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a lecture.

    This will automatically update all future calendar events associated with this lecture.

    Example:
    ```json
    {
      "location": "Room 202",
      "start_time": "10:00:00",
      "end_time": "12:00:00"
    }
    ```
    """
    lecture = DegreeService.update_lecture(db, lecture_id, lecture_update)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@router.delete("/lectures/{lecture_id}", status_code=204)
async def delete_lecture(
    lecture_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Delete a lecture.

    This will automatically delete all calendar events associated with this lecture.
    """
    success = DegreeService.delete_lecture(db, lecture_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return None
