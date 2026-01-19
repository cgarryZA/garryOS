/**
 * TypeScript types for Degree Tracker
 */

export interface DegreeProgram {
  id: string;
  user_id: string;
  name: string;
  institution?: string;
  target_grade?: number;
  total_credits_required: number;
  status: 'in_progress' | 'completed' | 'deferred';
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface Module {
  id: string;
  program_id: string;
  code?: string;
  name: string;
  credits: number;
  weighting?: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  semester?: number;
  academic_year?: string;
  created_at: string;
}

export interface Coursework {
  id: string;
  module_id: string;
  name: string;
  weighting: number;
  max_marks: number;
  achieved_marks?: number;
  percentage: number;
  is_graded: boolean;
  deadline?: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  submitted_at?: string;
  graded_at?: string;
  feedback?: string;
  created_at: string;
}

export interface ModuleStatistics {
  module_id: string;
  module_name: string;
  current_average?: number;
  completed_weighting: number;
  remaining_weighting: number;
  total_coursework: number;
  graded_coursework: number;
  best_case_grade: number;
  worst_case_grade: number;
}

export interface DegreeStatistics {
  program_id: string;
  program_name: string;
  overall_average?: number;
  completed_credits: number;
  remaining_credits: number;
  total_modules: number;
  completed_modules: number;
  target_grade?: number;
  on_track: boolean;
  best_case_grade: number;
  worst_case_grade: number;
  modules_stats: ModuleStatistics[];
}

export interface TargetGradeCalculation {
  target_grade: number;
  current_average: number;
  required_average_on_remaining: number;
  achievable: boolean;
  margin: number;
}

// Form data types
export interface DegreeProgramFormData {
  name: string;
  institution?: string;
  target_grade?: number;
  total_credits_required?: number;
  start_date?: string;
  end_date?: string;
}

export interface ModuleFormData {
  code?: string;
  name: string;
  credits?: number;
  weighting?: number;
  semester?: number;
  academic_year?: string;
}

export interface CourseworkFormData {
  name: string;
  weighting: number;
  max_marks?: number;
  achieved_marks?: number;
  deadline?: string;
  status?: string;
  feedback?: string;
}
