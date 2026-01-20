/**
 * Edit Coursework Modal Component
 * Form for editing existing coursework with pre-populated data and task link
 */
import { useState, useEffect } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import { degreesAPI } from '../../api/degrees';
import type { Coursework, CourseworkFormData } from '../../types/degrees';

interface EditCourseworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  coursework: Coursework;
  onSuccess: () => void;
}

export default function EditCourseworkModal({ isOpen, onClose, coursework, onSuccess }: EditCourseworkModalProps) {
  const [formData, setFormData] = useState<CourseworkFormData>({
    name: '',
    weighting: 0,
    max_marks: 100,
    achieved_marks: undefined,
    deadline: '',
    status: 'not_started',
    feedback: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingCoursework, setExistingCoursework] = useState<Coursework[]>([]);

  // Pre-populate form with existing coursework data
  useEffect(() => {
    if (coursework) {
      setFormData({
        name: coursework.name,
        weighting: coursework.weighting,
        max_marks: coursework.max_marks,
        achieved_marks: coursework.achieved_marks,
        deadline: coursework.deadline || '',
        status: coursework.status,
        feedback: coursework.feedback || '',
      });
    }
  }, [coursework]);

  // Load existing coursework to check weighting
  useEffect(() => {
    if (isOpen && coursework) {
      loadExistingCoursework();
    }
  }, [isOpen, coursework]);

  const loadExistingCoursework = async () => {
    try {
      const response = await degreesAPI.listCoursework(coursework.module_id);
      setExistingCoursework(response.data.filter(cw => cw.id !== coursework.id));
    } catch (error) {
      console.error('Failed to load existing coursework:', error);
    }
  };

  // Check if weighting exceeds 100%
  useEffect(() => {
    const totalExistingWeighting = existingCoursework.reduce((sum, cw) => sum + cw.weighting, 0);
    const totalWeighting = totalExistingWeighting + (formData.weighting || 0);

    if (totalWeighting > 100) {
      setWarnings([`Warning: Total weighting will be ${totalWeighting}%, which exceeds 100%`]);
    } else {
      setWarnings([]);
    }
  }, [formData.weighting, existingCoursework]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name required
    if (!formData.name.trim()) {
      newErrors.name = 'Coursework name is required';
    }

    // Weighting 0-100
    if (formData.weighting < 0 || formData.weighting > 100) {
      newErrors.weighting = 'Weighting must be between 0 and 100';
    }

    // Max marks > 0
    if (!formData.max_marks || formData.max_marks <= 0) {
      newErrors.max_marks = 'Max marks must be greater than 0';
    }

    // Achieved marks <= max marks
    if (formData.achieved_marks !== undefined && formData.max_marks) {
      if (formData.achieved_marks > formData.max_marks) {
        newErrors.achieved_marks = 'Achieved marks cannot exceed max marks';
      }
      if (formData.achieved_marks < 0) {
        newErrors.achieved_marks = 'Achieved marks cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Prepare data with proper types
      const submitData: CourseworkFormData = {
        name: formData.name,
        weighting: formData.weighting,
        max_marks: formData.max_marks,
        achieved_marks: formData.achieved_marks || undefined,
        deadline: formData.deadline || undefined,
        status: formData.status,
        feedback: formData.feedback || undefined,
      };

      await degreesAPI.updateCoursework(coursework.id, submitData);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update coursework:', error);
      setSubmitError(error.response?.data?.error || 'Failed to update coursework. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErrors({});
      setWarnings([]);
      setSubmitError('');
      onClose();
    }
  };

  // Format deadline for display
  const formatDeadline = (deadline?: string) => {
    if (!deadline) return '';
    // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
    return deadline.slice(0, 16);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Coursework">
      <form onSubmit={handleSubmit}>
        {/* Task Link Info - if associated task exists */}
        {coursework.deadline && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">
                Associated calendar task
              </p>
              <a
                href="/calendar"
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
              >
                View in Calendar
              </a>
            </div>
          </div>
        )}

        <FormField
          label="Coursework Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value as string })}
          placeholder="e.g., Assignment 1, Midterm Exam"
          required
          error={errors.name}
        />

        <FormField
          label="Weighting (%)"
          name="weighting"
          type="number"
          value={formData.weighting}
          onChange={(value) => setFormData({ ...formData, weighting: value as number })}
          placeholder="e.g., 30"
          required
          min={0}
          max={100}
          error={errors.weighting}
          info="Percentage contribution to module grade"
        />

        {warnings.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            {warnings.map((warning, index) => (
              <p key={index} className="text-sm text-yellow-700">{warning}</p>
            ))}
          </div>
        )}

        <FormField
          label="Max Marks"
          name="max_marks"
          type="number"
          value={formData.max_marks || ''}
          onChange={(value) => setFormData({ ...formData, max_marks: value as number })}
          placeholder="e.g., 100"
          required
          min={0}
          error={errors.max_marks}
        />

        <FormField
          label="Achieved Marks"
          name="achieved_marks"
          type="number"
          value={formData.achieved_marks || ''}
          onChange={(value) => setFormData({ ...formData, achieved_marks: value as number || undefined })}
          placeholder="Leave blank if not yet graded"
          min={0}
          error={errors.achieved_marks}
        />

        <FormField
          label="Deadline"
          name="deadline"
          type="datetime-local"
          value={formatDeadline(formData.deadline)}
          onChange={(value) => setFormData({ ...formData, deadline: value as string })}
          error={errors.deadline}
        />

        <FormField
          label="Status"
          name="status"
          type="select"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value as string })}
          error={errors.status}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
        </FormField>

        <FormField
          label="Feedback"
          name="feedback"
          type="textarea"
          value={formData.feedback || ''}
          onChange={(value) => setFormData({ ...formData, feedback: value as string })}
          placeholder="Teacher feedback or notes"
          rows={4}
          error={errors.feedback}
        />

        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
