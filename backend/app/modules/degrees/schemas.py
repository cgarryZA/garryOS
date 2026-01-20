"""
Pydantic schemas for degree tracker
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, date, time
from uuid import UUID


# Degree Program Schemas

class DegreeProgramCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Degree program name")
    institution: Optional[str] = Field(None, max_length=200)
    target_grade: Optional[float] = Field(None, ge=0, le=100, description="Target grade percentage")
    total_credits_required: int = Field(360, ge=0, description="Total credits required for degree")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class DegreeProgramUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    institution: Optional[str] = Field(None, max_length=200)
    target_grade: Optional[float] = Field(None, ge=0, le=100)
    total_credits_required: Optional[int] = Field(None, ge=0)
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class DegreeProgramResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    institution: Optional[str]
    target_grade: Optional[float]
    total_credits_required: int
    status: str
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Module Schemas

class ModuleCreate(BaseModel):
    code: Optional[str] = Field(None, max_length=50, description="Module code (e.g., CS101)")
    name: str = Field(..., min_length=1, max_length=200, description="Module name")
    credits: int = Field(10, ge=0, description="Number of credits")
    weighting: Optional[float] = Field(None, ge=0, le=100, description="Weighting toward final degree (%)")
    semester: Optional[int] = Field(None, ge=1, le=3)
    academic_year: Optional[str] = Field(None, max_length=20, description="e.g., 2023/2024")


class ModuleUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    credits: Optional[int] = Field(None, ge=0)
    weighting: Optional[float] = Field(None, ge=0, le=100)
    status: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=3)
    academic_year: Optional[str] = None


class ModuleResponse(BaseModel):
    id: UUID
    program_id: UUID
    code: Optional[str]
    name: str
    credits: int
    weighting: Optional[float]
    status: str
    semester: Optional[int]
    academic_year: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Coursework Schemas

class CourseworkCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Coursework name")
    weighting: float = Field(..., ge=0, le=100, description="Weighting within module (%)")
    max_marks: float = Field(100.0, gt=0, description="Maximum possible marks")
    achieved_marks: Optional[float] = Field(None, ge=0, description="Actual marks achieved")
    deadline: Optional[datetime] = None
    status: Optional[str] = "not_started"
    feedback: Optional[str] = Field(None, max_length=2000)

    @field_validator('achieved_marks')
    @classmethod
    def validate_achieved_marks(cls, v, info):
        if v is not None and info.data.get('max_marks') and v > info.data['max_marks']:
            raise ValueError('achieved_marks cannot exceed max_marks')
        return v


class CourseworkUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    weighting: Optional[float] = Field(None, ge=0, le=100)
    max_marks: Optional[float] = Field(None, gt=0)
    achieved_marks: Optional[float] = Field(None, ge=0)
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None
    feedback: Optional[str] = Field(None, max_length=2000)


class CourseworkResponse(BaseModel):
    id: UUID
    module_id: UUID
    name: str
    weighting: float
    max_marks: float
    achieved_marks: Optional[float]
    percentage: float
    is_graded: bool
    deadline: Optional[datetime]
    status: str
    submitted_at: Optional[datetime]
    graded_at: Optional[datetime]
    feedback: Optional[str]
    linked_task_id: Optional[UUID] = None
    task_status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Statistics Schemas

class ModuleStatistics(BaseModel):
    module_id: UUID
    module_name: str
    current_average: Optional[float] = Field(None, description="Current weighted average")
    completed_weighting: float = Field(description="% of module graded")
    remaining_weighting: float = Field(description="% of module remaining")
    total_coursework: int
    graded_coursework: int
    best_case_grade: float = Field(description="Best possible grade")
    worst_case_grade: float = Field(description="Worst possible grade")


class DegreeStatistics(BaseModel):
    program_id: UUID
    program_name: str
    overall_average: Optional[float] = Field(None, description="Current degree average")
    completed_credits: int
    remaining_credits: int
    total_modules: int
    completed_modules: int
    target_grade: Optional[float]
    on_track: bool = Field(description="Whether on track for target grade")
    best_case_grade: float
    worst_case_grade: float
    modules_stats: List[ModuleStatistics]


class TargetGradeCalculation(BaseModel):
    target_grade: float
    current_average: float
    required_average_on_remaining: float = Field(description="Required average on remaining coursework")
    achievable: bool = Field(description="Whether target is still achievable")
    margin: float = Field(description="How much above/below required average")


# Lecture Schemas

class LectureCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Lecture title")
    location: Optional[str] = Field(None, max_length=200, description="Lecture location")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    start_time: time = Field(..., description="Lecture start time")
    end_time: time = Field(..., description="Lecture end time")
    recurrence_start_date: date = Field(..., description="First occurrence date")
    recurrence_end_date: date = Field(..., description="Last occurrence date")
    notes: Optional[str] = Field(None, description="Additional notes")

    @field_validator('end_time')
    @classmethod
    def validate_end_time(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

    @field_validator('recurrence_end_date')
    @classmethod
    def validate_recurrence_end_date(cls, v, info):
        if 'recurrence_start_date' in info.data and v < info.data['recurrence_start_date']:
            raise ValueError('recurrence_end_date must be on or after recurrence_start_date')
        return v


class LectureUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    recurrence_start_date: Optional[date] = None
    recurrence_end_date: Optional[date] = None
    notes: Optional[str] = None


class LectureResponse(BaseModel):
    id: UUID
    module_id: UUID
    title: str
    location: Optional[str]
    day_of_week: int
    start_time: time
    end_time: time
    recurrence_start_date: date
    recurrence_end_date: date
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
