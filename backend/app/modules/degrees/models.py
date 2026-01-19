"""
Degree tracker database models
"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.models import BaseModel


class DegreeStatus(str, enum.Enum):
    """Degree program status"""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DEFERRED = "deferred"


class ModuleStatus(str, enum.Enum):
    """Module status"""
    UPCOMING = "upcoming"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class CourseworkStatus(str, enum.Enum):
    """Coursework status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"


class DegreeProgram(BaseModel):
    """
    Represents a degree program (e.g., BSc Computer Science)
    """
    __tablename__ = "degree_programs"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)  # e.g., "BSc Computer Science"
    institution = Column(String(200))  # e.g., "University of X"
    target_grade = Column(Float)  # e.g., 70.0 for First Class
    total_credits_required = Column(Integer, default=360)  # e.g., 360 credits for 3-year degree
    status = Column(SQLEnum(DegreeStatus), default=DegreeStatus.IN_PROGRESS)
    start_date = Column(DateTime)
    end_date = Column(DateTime)

    # Relationships
    modules = relationship("Module", back_populates="program", cascade="all, delete-orphan")
    user = relationship("User")


class Module(BaseModel):
    """
    Represents a module/course within a degree program
    """
    __tablename__ = "modules"

    program_id = Column(String(36), ForeignKey("degree_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50))  # e.g., "CS101"
    name = Column(String(200), nullable=False)  # e.g., "Introduction to Programming"
    credits = Column(Integer, default=10)  # Number of credits
    weighting = Column(Float)  # Percentage weighting toward final degree (e.g., 10.0 for 10%)
    status = Column(SQLEnum(ModuleStatus), default=ModuleStatus.UPCOMING)
    semester = Column(Integer)  # e.g., 1, 2
    academic_year = Column(String(20))  # e.g., "2023/2024"

    # Relationships
    program = relationship("DegreeProgram", back_populates="modules")
    coursework = relationship("Coursework", back_populates="module", cascade="all, delete-orphan")


class Coursework(BaseModel):
    """
    Represents a piece of coursework/assessment within a module
    """
    __tablename__ = "coursework"

    module_id = Column(String(36), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)  # e.g., "Midterm Exam", "Final Project"
    weighting = Column(Float, nullable=False)  # Percentage weighting within module (e.g., 40.0 for 40%)
    max_marks = Column(Float, default=100.0)  # Maximum possible marks (usually 100)
    achieved_marks = Column(Float)  # Actual marks achieved
    deadline = Column(DateTime)
    status = Column(SQLEnum(CourseworkStatus), default=CourseworkStatus.NOT_STARTED)
    submitted_at = Column(DateTime)
    graded_at = Column(DateTime)
    feedback = Column(String(2000))  # Teacher feedback

    # Relationships
    module = relationship("Module", back_populates="coursework")

    @property
    def percentage(self) -> float:
        """Calculate percentage score"""
        if self.achieved_marks is not None and self.max_marks:
            return (self.achieved_marks / self.max_marks) * 100
        return 0.0

    @property
    def is_graded(self) -> bool:
        """Check if coursework has been graded"""
        return self.achieved_marks is not None
