"""
Degree tracker service layer - business logic and calculations
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.modules.degrees.models import DegreeProgram, Module, Coursework, ModuleStatus, CourseworkStatus
from app.modules.degrees.schemas import (
    DegreeProgramCreate,
    DegreeProgramUpdate,
    ModuleCreate,
    ModuleUpdate,
    CourseworkCreate,
    CourseworkUpdate,
    ModuleStatistics,
    DegreeStatistics,
    TargetGradeCalculation,
)


class DegreeService:
    """Service layer for degree tracking with grade calculations"""

    # ===== Degree Program Methods =====

    @staticmethod
    def create_program(db: Session, program: DegreeProgramCreate, user_id: UUID) -> DegreeProgram:
        """Create a new degree program"""
        db_program = DegreeProgram(
            user_id=user_id,
            name=program.name,
            institution=program.institution,
            target_grade=program.target_grade,
            total_credits_required=program.total_credits_required,
            start_date=program.start_date,
            end_date=program.end_date,
        )
        db.add(db_program)
        db.commit()
        db.refresh(db_program)
        return db_program

    @staticmethod
    def get_program(db: Session, program_id: UUID, user_id: UUID) -> Optional[DegreeProgram]:
        """Get a degree program by ID"""
        return (
            db.query(DegreeProgram)
            .filter(DegreeProgram.id == program_id, DegreeProgram.user_id == user_id)
            .first()
        )

    @staticmethod
    def list_programs(db: Session, user_id: UUID) -> List[DegreeProgram]:
        """List all degree programs for a user"""
        return db.query(DegreeProgram).filter(DegreeProgram.user_id == user_id).all()

    @staticmethod
    def update_program(
        db: Session, program_id: UUID, user_id: UUID, program_update: DegreeProgramUpdate
    ) -> Optional[DegreeProgram]:
        """Update a degree program"""
        db_program = DegreeService.get_program(db, program_id, user_id)
        if not db_program:
            return None

        update_data = program_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_program, field, value)

        db.commit()
        db.refresh(db_program)
        return db_program

    @staticmethod
    def delete_program(db: Session, program_id: UUID, user_id: UUID) -> bool:
        """Delete a degree program and all associated data"""
        db_program = DegreeService.get_program(db, program_id, user_id)
        if not db_program:
            return False

        db.delete(db_program)
        db.commit()
        return True

    # ===== Module Methods =====

    @staticmethod
    def create_module(db: Session, program_id: UUID, user_id: UUID, module: ModuleCreate) -> Module:
        """Create a new module"""
        # Verify program exists and belongs to user
        program = DegreeService.get_program(db, program_id, user_id)
        if not program:
            raise ValueError("Degree program not found")

        db_module = Module(
            program_id=program_id,
            code=module.code,
            name=module.name,
            credits=module.credits,
            weighting=module.weighting,
            semester=module.semester,
            academic_year=module.academic_year,
        )
        db.add(db_module)
        db.commit()
        db.refresh(db_module)
        return db_module

    @staticmethod
    def get_module(db: Session, module_id: UUID) -> Optional[Module]:
        """Get a module by ID"""
        return db.query(Module).filter(Module.id == module_id).first()

    @staticmethod
    def list_modules(db: Session, program_id: UUID, user_id: UUID) -> List[Module]:
        """List all modules for a degree program"""
        # Verify program belongs to user
        program = DegreeService.get_program(db, program_id, user_id)
        if not program:
            return []

        return db.query(Module).filter(Module.program_id == program_id).all()

    @staticmethod
    def update_module(db: Session, module_id: UUID, module_update: ModuleUpdate) -> Optional[Module]:
        """Update a module"""
        db_module = DegreeService.get_module(db, module_id)
        if not db_module:
            return None

        update_data = module_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_module, field, value)

        db.commit()
        db.refresh(db_module)
        return db_module

    @staticmethod
    def delete_module(db: Session, module_id: UUID) -> bool:
        """Delete a module and all associated coursework"""
        db_module = DegreeService.get_module(db, module_id)
        if not db_module:
            return False

        db.delete(db_module)
        db.commit()
        return True

    # ===== Coursework Methods =====

    @staticmethod
    def create_coursework(db: Session, module_id: UUID, coursework: CourseworkCreate) -> Coursework:
        """Create a new coursework item"""
        # Verify module exists
        module = DegreeService.get_module(db, module_id)
        if not module:
            raise ValueError("Module not found")

        db_coursework = Coursework(
            module_id=module_id,
            name=coursework.name,
            weighting=coursework.weighting,
            max_marks=coursework.max_marks,
            achieved_marks=coursework.achieved_marks,
            deadline=coursework.deadline,
            status=coursework.status,
            feedback=coursework.feedback,
        )

        # Auto-set graded_at if marks provided
        if coursework.achieved_marks is not None:
            db_coursework.status = CourseworkStatus.GRADED
            db_coursework.graded_at = datetime.utcnow()

        db.add(db_coursework)
        db.commit()
        db.refresh(db_coursework)
        return db_coursework

    @staticmethod
    def get_coursework(db: Session, coursework_id: UUID) -> Optional[Coursework]:
        """Get a coursework item by ID"""
        return db.query(Coursework).filter(Coursework.id == coursework_id).first()

    @staticmethod
    def list_coursework(db: Session, module_id: UUID) -> List[Coursework]:
        """List all coursework for a module"""
        return db.query(Coursework).filter(Coursework.module_id == module_id).all()

    @staticmethod
    def update_coursework(
        db: Session, coursework_id: UUID, coursework_update: CourseworkUpdate
    ) -> Optional[Coursework]:
        """Update a coursework item"""
        db_coursework = DegreeService.get_coursework(db, coursework_id)
        if not db_coursework:
            return None

        update_data = coursework_update.model_dump(exclude_unset=True)

        # Auto-set graded_at if marks are being added
        if 'achieved_marks' in update_data and update_data['achieved_marks'] is not None:
            if db_coursework.achieved_marks is None:  # First time grading
                update_data['graded_at'] = datetime.utcnow()
                update_data['status'] = CourseworkStatus.GRADED

        for field, value in update_data.items():
            setattr(db_coursework, field, value)

        db.commit()
        db.refresh(db_coursework)
        return db_coursework

    @staticmethod
    def delete_coursework(db: Session, coursework_id: UUID) -> bool:
        """Delete a coursework item"""
        db_coursework = DegreeService.get_coursework(db, coursework_id)
        if not db_coursework:
            return False

        db.delete(db_coursework)
        db.commit()
        return True

    # ===== Statistics & Calculations =====

    @staticmethod
    def calculate_module_stats(db: Session, module_id: UUID) -> ModuleStatistics:
        """Calculate statistics for a module"""
        module = DegreeService.get_module(db, module_id)
        if not module:
            raise ValueError("Module not found")

        coursework_items = DegreeService.list_coursework(db, module_id)

        total_coursework = len(coursework_items)
        graded_coursework = sum(1 for c in coursework_items if c.is_graded)

        # Calculate completed and remaining weighting
        completed_weighting = sum(c.weighting for c in coursework_items if c.is_graded)
        total_weighting = sum(c.weighting for c in coursework_items)
        remaining_weighting = total_weighting - completed_weighting

        # Calculate current weighted average
        current_average = None
        if graded_coursework > 0:
            weighted_sum = sum(c.percentage * (c.weighting / 100) for c in coursework_items if c.is_graded)
            if completed_weighting > 0:
                current_average = (weighted_sum / completed_weighting) * 100

        # Calculate best/worst case scenarios
        current_contribution = sum(
            c.percentage * (c.weighting / 100) for c in coursework_items if c.is_graded
        )

        # Best case: get 100% on all remaining coursework
        best_case_grade = current_contribution + remaining_weighting
        if total_weighting > 0:
            best_case_grade = (best_case_grade / total_weighting) * 100

        # Worst case: get 0% on all remaining coursework
        worst_case_grade = current_contribution
        if total_weighting > 0:
            worst_case_grade = (worst_case_grade / total_weighting) * 100

        return ModuleStatistics(
            module_id=module.id,
            module_name=module.name,
            current_average=current_average,
            completed_weighting=completed_weighting,
            remaining_weighting=remaining_weighting,
            total_coursework=total_coursework,
            graded_coursework=graded_coursework,
            best_case_grade=best_case_grade,
            worst_case_grade=worst_case_grade,
        )

    @staticmethod
    def calculate_degree_stats(db: Session, program_id: UUID, user_id: UUID) -> DegreeStatistics:
        """Calculate overall statistics for a degree program"""
        program = DegreeService.get_program(db, program_id, user_id)
        if not program:
            raise ValueError("Degree program not found")

        modules = DegreeService.list_modules(db, program_id, user_id)
        total_modules = len(modules)
        completed_modules = sum(1 for m in modules if m.status == ModuleStatus.COMPLETED)

        # Calculate credits
        completed_credits = sum(m.credits for m in modules if m.status == ModuleStatus.COMPLETED)
        remaining_credits = program.total_credits_required - completed_credits

        # Calculate module statistics
        modules_stats = []
        total_weighted_grade = 0
        total_weighting = 0
        best_case_total = 0
        worst_case_total = 0

        for module in modules:
            module_stats = DegreeService.calculate_module_stats(db, module.id)
            modules_stats.append(module_stats)

            if module.weighting and module_stats.current_average is not None:
                total_weighted_grade += module_stats.current_average * (module.weighting / 100)
                total_weighting += module.weighting

            if module.weighting:
                best_case_total += module_stats.best_case_grade * (module.weighting / 100)
                worst_case_total += module_stats.worst_case_grade * (module.weighting / 100)

        # Calculate overall average
        overall_average = None
        if total_weighting > 0:
            overall_average = total_weighted_grade

        # Calculate best/worst case for degree
        remaining_weighting = 100 - total_weighting
        best_case_degree = best_case_total + remaining_weighting
        worst_case_degree = worst_case_total

        # Check if on track for target
        on_track = True
        if program.target_grade and overall_average is not None:
            on_track = overall_average >= program.target_grade

        return DegreeStatistics(
            program_id=program.id,
            program_name=program.name,
            overall_average=overall_average,
            completed_credits=completed_credits,
            remaining_credits=remaining_credits,
            total_modules=total_modules,
            completed_modules=completed_modules,
            target_grade=program.target_grade,
            on_track=on_track,
            best_case_grade=best_case_degree,
            worst_case_grade=worst_case_degree,
            modules_stats=modules_stats,
        )

    @staticmethod
    def calculate_target_grade(
        db: Session, program_id: UUID, user_id: UUID, target_grade: float
    ) -> TargetGradeCalculation:
        """Calculate what's needed on remaining coursework to achieve target grade"""
        stats = DegreeService.calculate_degree_stats(db, program_id, user_id)

        current_average = stats.overall_average or 0
        current_contribution = 0
        total_weighting = 0

        modules = DegreeService.list_modules(db, program_id, user_id)

        for module in modules:
            if module.weighting:
                module_stats = DegreeService.calculate_module_stats(db, module.id)
                total_weighting += module.weighting

                if module_stats.current_average is not None:
                    current_contribution += module_stats.current_average * (module.weighting / 100)

        remaining_weighting = 100 - total_weighting

        # Calculate required average on remaining work
        required_total = target_grade * 100  # We need this total contribution
        required_from_remaining = required_total - current_contribution

        required_average_on_remaining = 0
        achievable = True

        if remaining_weighting > 0:
            required_average_on_remaining = required_from_remaining / remaining_weighting
            achievable = required_average_on_remaining <= 100
        elif remaining_weighting == 0:
            # No remaining work - target is achievable only if current average meets it
            achievable = current_average >= target_grade
            required_average_on_remaining = 0
        else:
            achievable = False

        margin = 100 - required_average_on_remaining if achievable else 0

        return TargetGradeCalculation(
            target_grade=target_grade,
            current_average=current_average,
            required_average_on_remaining=required_average_on_remaining,
            achievable=achievable,
            margin=margin,
        )
