/**
 * API client functions for Degree Tracker
 */
import client from './client';
import type {
  DegreeProgram,
  Module,
  Coursework,
  ModuleStatistics,
  DegreeStatistics,
  TargetGradeCalculation,
  DegreeProgramFormData,
  ModuleFormData,
  CourseworkFormData,
  Lecture,
  LectureFormData,
} from '../types/degrees';

// Degree Programs
export const degreesAPI = {
  // Programs
  createProgram: (data: DegreeProgramFormData) =>
    client.post<DegreeProgram>('/api/degrees/programs', data),

  listPrograms: () =>
    client.get<DegreeProgram[]>('/api/degrees/programs'),

  getProgram: (programId: string) =>
    client.get<DegreeProgram>(`/api/degrees/programs/${programId}`),

  updateProgram: (programId: string, data: Partial<DegreeProgramFormData>) =>
    client.put<DegreeProgram>(`/api/degrees/programs/${programId}`, data),

  deleteProgram: (programId: string) =>
    client.delete(`/api/degrees/programs/${programId}`),

  // Modules
  createModule: (programId: string, data: ModuleFormData) =>
    client.post<Module>(`/api/degrees/programs/${programId}/modules`, data),

  listModules: (programId: string) =>
    client.get<Module[]>(`/api/degrees/programs/${programId}/modules`),

  getModule: (moduleId: string) =>
    client.get<Module>(`/api/degrees/modules/${moduleId}`),

  updateModule: (moduleId: string, data: Partial<ModuleFormData>) =>
    client.put<Module>(`/api/degrees/modules/${moduleId}`, data),

  deleteModule: (moduleId: string) =>
    client.delete(`/api/degrees/modules/${moduleId}`),

  // Coursework
  createCoursework: (moduleId: string, data: CourseworkFormData) =>
    client.post<Coursework>(`/api/degrees/modules/${moduleId}/coursework`, data),

  listCoursework: (moduleId: string) =>
    client.get<Coursework[]>(`/api/degrees/modules/${moduleId}/coursework`),

  getCoursework: (courseworkId: string) =>
    client.get<Coursework>(`/api/degrees/coursework/${courseworkId}`),

  updateCoursework: (courseworkId: string, data: Partial<CourseworkFormData>) =>
    client.put<Coursework>(`/api/degrees/coursework/${courseworkId}`, data),

  deleteCoursework: (courseworkId: string) =>
    client.delete(`/api/degrees/coursework/${courseworkId}`),

  // Statistics
  getModuleStats: (moduleId: string) =>
    client.get<ModuleStatistics>(`/api/degrees/modules/${moduleId}/stats`),

  getDegreeStats: (programId: string) =>
    client.get<DegreeStatistics>(`/api/degrees/programs/${programId}/stats`),

  calculateTargetGrade: (programId: string, targetGrade: number) =>
    client.get<TargetGradeCalculation>(
      `/api/degrees/programs/${programId}/target-grade?target_grade=${targetGrade}`
    ),

  // Lectures
  createLecture: (moduleId: string, data: LectureFormData) =>
    client.post<Lecture>(`/api/degrees/modules/${moduleId}/lectures`, data),

  listLectures: (moduleId: string) =>
    client.get<Lecture[]>(`/api/degrees/modules/${moduleId}/lectures`),

  getLecture: (lectureId: string) =>
    client.get<Lecture>(`/api/degrees/lectures/${lectureId}`),

  updateLecture: (lectureId: string, data: Partial<LectureFormData>) =>
    client.put<Lecture>(`/api/degrees/lectures/${lectureId}`, data),

  deleteLecture: (lectureId: string) =>
    client.delete(`/api/degrees/lectures/${lectureId}`),
};
