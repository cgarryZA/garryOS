/**
 * CourseworkTable - Table component for displaying and managing coursework
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { degreesAPI } from '../../api/degrees';
import type { Coursework } from '../../types/degrees';
import InlineMarkEditor from './InlineMarkEditor';

interface CourseworkTableProps {
  coursework: Coursework[];
  moduleId: string;
  onEdit?: (coursework: Coursework) => void;
  onDelete?: (courseworkId: string) => void;
}

export default function CourseworkTable({
  coursework,
  moduleId,
  onEdit,
  onDelete
}: CourseworkTableProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sort coursework by deadline (ascending, with null values at the end)
  const sortedCoursework = [...coursework].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  // Update coursework marks mutation
  const updateMarksMutation = useMutation({
    mutationFn: async ({ id, marks }: { id: string; marks: number | null }) => {
      const response = await degreesAPI.updateCoursework(id, {
        achieved_marks: marks === null ? undefined : marks
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['coursework', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['module-stats', moduleId] });
    }
  });

  // Delete coursework mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await degreesAPI.deleteCoursework(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coursework', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['module-stats', moduleId] });
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    }
  });

  const handleUpdateMarks = async (courseworkId: string, marks: number | null) => {
    await updateMarksMutation.mutateAsync({ id: courseworkId, marks });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this coursework?')) {
      setDeletingId(id);
      await deleteMutation.mutateAsync(id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date() && !isGraded;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="text-green-600 text-lg" title="Task completed">
            ✓
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-yellow-600 text-lg" title="Task in progress">
            ⏳
          </span>
        );
      default:
        return (
          <span className="text-gray-400 text-lg" title="Not started">
            ⭕
          </span>
        );
    }
  };

  if (coursework.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-600">No coursework added yet.</p>
        <p className="text-sm text-gray-500 mt-2">Click "+ Add Coursework" to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Weighting
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Deadline
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Marks
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Percentage
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Task
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedCoursework.map((item) => {
              const isGraded = item.is_graded || item.achieved_marks !== null;
              const overdueRow = isOverdue(item.deadline);

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    overdueRow ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-700">{item.weighting}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm ${
                        overdueRow ? 'text-red-600 font-semibold' : 'text-gray-600'
                      }`}
                    >
                      {formatDate(item.deadline)}
                      {overdueRow && ' (Overdue)'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <InlineMarkEditor
                      value={item.achieved_marks || null}
                      maxMarks={item.max_marks}
                      onSave={(marks) => handleUpdateMarks(item.id, marks)}
                      isLoading={updateMarksMutation.isPending}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {isGraded ? (
                      <span
                        className={`font-bold ${
                          item.percentage >= 70
                            ? 'text-green-600'
                            : item.percentage >= 60
                            ? 'text-blue-600'
                            : item.percentage >= 50
                            ? 'text-yellow-600'
                            : item.percentage >= 40
                            ? 'text-orange-600'
                            : 'text-red-600'
                        }`}
                      >
                        {item.percentage.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-sm">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="hover:scale-125 transition-transform"
                      onClick={() => {
                        // TODO: Navigate to calendar task
                        console.log('Navigate to task for coursework:', item.id);
                      }}
                      title="View associated task"
                    >
                      {getTaskStatusIcon(item.status)}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit?.(item)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit coursework"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                        title="Delete coursework"
                      >
                        {deletingId === item.id ? (
                          <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
