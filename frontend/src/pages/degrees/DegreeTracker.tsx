/**
 * Degree Tracker - Main page for managing degree programs, modules, and coursework
 */
import { useState, useEffect } from 'react';
import { degreesAPI } from '../../api/degrees';
import type { DegreeProgram, Module, DegreeStatistics } from '../../types/degrees';

export default function DegreeTracker() {
  const [programs, setPrograms] = useState<DegreeProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [stats, setStats] = useState<DegreeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);

  // Load programs on mount
  useEffect(() => {
    loadPrograms();
  }, []);

  // Load modules when program selected
  useEffect(() => {
    if (selectedProgram) {
      loadModules(selectedProgram);
      loadStats(selectedProgram);
    }
  }, [selectedProgram]);

  const loadPrograms = async () => {
    try {
      const response = await degreesAPI.listPrograms();
      setPrograms(response.data);
      if (response.data.length > 0 && !selectedProgram) {
        setSelectedProgram(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (programId: string) => {
    try {
      const response = await degreesAPI.listModules(programId);
      setModules(response.data);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  const loadStats = async (programId: string) => {
    try {
      const response = await degreesAPI.getDegreeStats(programId);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading degree tracker...</p>
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <svg
            className="w-24 h-24 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Degree Programs Yet</h2>
          <p className="text-gray-600 mb-6">
            Get started by creating your first degree program to track your academic progress.
          </p>
          <button
            onClick={() => setShowAddProgram(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Create Degree Program
          </button>
        </div>
      </div>
    );
  }

  const currentProgram = programs.find(p => p.id === selectedProgram);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Degree Tracker</h1>
            <p className="text-gray-600 mt-1">Track your academic progress and grades</p>
          </div>
          <button
            onClick={() => setShowAddProgram(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            + New Program
          </button>
        </div>

        {/* Program Selector */}
        {programs.length > 1 && (
          <select
            value={selectedProgram || ''}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {programs.map(program => (
              <option key={program.id} value={program.id}>
                {program.name} {program.institution && `- ${program.institution}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Current Average</div>
            <div className={`text-3xl font-bold ${getGradeClass(stats.overall_average)}`}>
              {stats.overall_average ? `${stats.overall_average.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {getGradeLabel(stats.overall_average)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Target Grade</div>
            <div className={`text-3xl font-bold ${getGradeClass(stats.target_grade)}`}>
              {stats.target_grade ? `${stats.target_grade.toFixed(0)}%` : 'Not Set'}
            </div>
            <div className={`text-xs mt-1 font-semibold ${stats.on_track ? 'text-green-600' : 'text-red-600'}`}>
              {stats.target_grade ? (stats.on_track ? '✓ On Track' : '✗ Below Target') : ''}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Credits Completed</div>
            <div className="text-3xl font-bold text-gray-800">
              {stats.completed_credits}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              of {stats.completed_credits + stats.remaining_credits} total
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${(stats.completed_credits / (stats.completed_credits + stats.remaining_credits)) * 100}%`
                }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Modules</div>
            <div className="text-3xl font-bold text-gray-800">
              {stats.completed_modules}/{stats.total_modules}
            </div>
            <div className="text-xs text-gray-500 mt-1">completed</div>
          </div>
        </div>
      )}

      {/* Best/Worst Case Scenario */}
      {stats && stats.overall_average && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Grade Projections</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Best Case</div>
              <div className={`text-2xl font-bold ${getGradeClass(stats.best_case_grade)}`}>
                {stats.best_case_grade.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">{getGradeLabel(stats.best_case_grade)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Current</div>
              <div className={`text-2xl font-bold ${getGradeClass(stats.overall_average)}`}>
                {stats.overall_average.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">{getGradeLabel(stats.overall_average)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Worst Case</div>
              <div className={`text-2xl font-bold ${getGradeClass(stats.worst_case_grade)}`}>
                {stats.worst_case_grade.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">{getGradeLabel(stats.worst_case_grade)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Modules Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Modules</h2>
          <button
            onClick={() => setShowAddModule(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            + Add Module
          </button>
        </div>

        {modules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No modules yet. Add your first module to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map(module => (
              <div key={module.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    {module.code && (
                      <div className="text-sm font-semibold text-blue-600 mb-1">{module.code}</div>
                    )}
                    <h3 className="font-bold text-gray-800">{module.name}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    module.status === 'completed' ? 'bg-green-100 text-green-800' :
                    module.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {module.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <span className="font-semibold">{module.credits}</span>
                  </div>
                  {module.weighting && (
                    <div className="flex justify-between">
                      <span>Weighting:</span>
                      <span className="font-semibold">{module.weighting}%</span>
                    </div>
                  )}
                  {module.semester && (
                    <div className="flex justify-between">
                      <span>Semester:</span>
                      <span className="font-semibold">{module.semester}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {/* Navigate to module details */}}
                  className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg font-semibold transition-colors"
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals would go here */}
      {showAddProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Degree Program</h3>
            {/* Form fields here */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddProgram(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
