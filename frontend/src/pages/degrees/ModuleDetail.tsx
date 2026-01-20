/**
 * ModuleDetail - Detailed view of a module with lectures and coursework
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { degreesAPI } from '../../api/degrees';
import LectureSchedule from '../../components/degrees/LectureSchedule';
import CourseworkTable from '../../components/degrees/CourseworkTable';
import type { Coursework, Lecture } from '../../types/degrees';

export default function ModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [showAddCoursework, setShowAddCoursework] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [editingCoursework, setEditingCoursework] = useState<Coursework | null>(null);

  // Fetch module details
  const { data: module, isLoading: moduleLoading } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: async () => {
      if (!moduleId) throw new Error('Module ID required');
      const response = await degreesAPI.getModule(moduleId);
      return response.data;
    },
    enabled: !!moduleId
  });

  // Fetch module statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['module-stats', moduleId],
    queryFn: async () => {
      if (!moduleId) throw new Error('Module ID required');
      const response = await degreesAPI.getModuleStats(moduleId);
      return response.data;
    },
    enabled: !!moduleId
  });

  // Fetch lectures
  const { data: lectures = [], isLoading: lecturesLoading } = useQuery({
    queryKey: ['lectures', moduleId],
    queryFn: async () => {
      if (!moduleId) throw new Error('Module ID required');
      const response = await degreesAPI.listLectures(moduleId);
      return response.data;
    },
    enabled: !!moduleId
  });

  // Fetch coursework
  const { data: coursework = [], isLoading: courseworkLoading } = useQuery({
    queryKey: ['coursework', moduleId],
    queryFn: async () => {
      if (!moduleId) throw new Error('Module ID required');
      const response = await degreesAPI.listCoursework(moduleId);
      return response.data;
    },
    enabled: !!moduleId
  });

  const getGradeClass = (grade?: number) => {
    if (!grade) return '';
    if (grade >= 70) return 'text-green-600 font-bold';
    if (grade >= 60) return 'text-blue-600 font-semibold';
    if (grade >= 50) return 'text-yellow-600';
    if (grade >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeLabel = (grade?: number) => {
    if (!grade) return 'N/A';
    if (grade >= 70) return 'First Class';
    if (grade >= 60) return '2:1 (Upper Second)';
    if (grade >= 50) return '2:2 (Lower Second)';
    if (grade >= 40) return 'Third Class';
    return 'Fail';
  };

  if (moduleLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading module details...</p>
        </div>
      </div>
    );
  }

  if (!module || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Module not found</p>
          <button
            onClick={() => navigate('/degrees')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Degree Tracker
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <button
        onClick={() => navigate('/degrees')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Degree Tracker
      </button>

      {/* Module Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            {module.code && (
              <div className="text-blue-200 font-semibold mb-2">{module.code}</div>
            )}
            <h1 className="text-3xl font-bold mb-3">{module.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{module.credits} Credits</span>
              </div>
              {module.weighting && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                  <span>{module.weighting}% of Degree</span>
                </div>
              )}
              {module.semester && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Semester {module.semester}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200 mb-1">Current Average</div>
            <div className="text-4xl font-bold mb-2">
              {stats.current_average ? `${stats.current_average.toFixed(1)}%` : 'N/A'}
            </div>
            {stats.current_average && (
              <div className="text-sm text-blue-100">
                {getGradeLabel(stats.current_average)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.completed_weighting.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">of weighting</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Remaining</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.remaining_weighting.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">to be graded</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Coursework</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.graded_coursework}/{stats.total_coursework}
          </div>
          <div className="text-xs text-gray-500 mt-1">graded</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Status</div>
          <div className={`text-2xl font-bold ${
            module.status === 'completed' ? 'text-green-600' :
            module.status === 'in_progress' ? 'text-blue-600' :
            'text-gray-600'
          }`}>
            {module.status === 'completed' ? 'Completed' :
             module.status === 'in_progress' ? 'In Progress' :
             'Upcoming'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Module Progress</span>
          <span className="text-sm text-gray-600">
            {stats.completed_weighting.toFixed(0)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${stats.completed_weighting}%` }}
          ></div>
        </div>
      </div>

      {/* Best/Worst Case Projections */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Grade Projections for This Module</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Best Case</div>
            <div className={`text-3xl font-bold ${getGradeClass(stats.best_case_grade)}`}>
              {stats.best_case_grade.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {getGradeLabel(stats.best_case_grade)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              (100% on remaining work)
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Current Average</div>
            <div className={`text-3xl font-bold ${getGradeClass(stats.current_average)}`}>
              {stats.current_average ? `${stats.current_average.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.current_average ? getGradeLabel(stats.current_average) : 'No grades yet'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Worst Case</div>
            <div className={`text-3xl font-bold ${getGradeClass(stats.worst_case_grade)}`}>
              {stats.worst_case_grade.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {getGradeLabel(stats.worst_case_grade)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              (0% on remaining work)
            </div>
          </div>
        </div>
      </div>

      {/* Lecture Schedule Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Lecture Schedule</h2>
          <button
            onClick={() => setShowAddLecture(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Lecture
          </button>
        </div>
        {lecturesLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <LectureSchedule
            lectures={lectures}
            moduleId={moduleId!}
            onAdd={() => setShowAddLecture(true)}
            onEdit={(lecture) => setEditingLecture(lecture)}
          />
        )}
      </div>

      {/* Coursework Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Coursework</h2>
          <button
            onClick={() => setShowAddCoursework(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Coursework
          </button>
        </div>
        {courseworkLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <CourseworkTable
            coursework={coursework}
            moduleId={moduleId!}
            onEdit={(cw) => setEditingCoursework(cw)}
          />
        )}
      </div>

      {/* Modals would go here - Add Lecture, Edit Lecture, Add Coursework, Edit Coursework */}
      {/* For now, these are placeholders */}
      {showAddLecture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Lecture</h3>
            <p className="text-gray-600 mb-4">Lecture creation form will be implemented here.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddLecture(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCoursework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Coursework</h3>
            <p className="text-gray-600 mb-4">Coursework creation form will be implemented here.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddCoursework(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
