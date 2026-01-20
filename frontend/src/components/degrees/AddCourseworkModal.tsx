/**
 * Add Coursework Modal Component
 * Form for creating new coursework with weighting validation
 */
import { useState, useEffect } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import { degreesAPI } from '../../api/degrees';
import type { CourseworkFormData, Coursework } from '../../types/degrees';

interface AddCourseworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
}

export default function AddCourseworkModal({ isOpen, onClose, moduleId, onSuccess }: AddCourseworkModalProps) {
  const [formData, setFormData] = useState<CourseworkFormData>({
    name: '',
    weighting: 0,
    max_marks: 100,
    achieved_marks: undefined,
    deadline: '',
    status: 'not_started',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingCoursework, setExistingCoursework] = useState<Coursework[]>([]);

  // Load existing coursework to check weighting
  useEffect(() => {
    if (isOpen && moduleId) {
      loadExistingCoursework();
    }
  }, [isOpen, moduleId]);

  const loadExistingCoursework = async () => {
    try {
      const response = await degreesAPI.listCoursework(moduleId);
      setExistingCoursework(response.data);
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
      };

      await degreesAPI.createCoursework(moduleId, submitData);

      // Reset form
      setFormData({
        name: '',
        weighting: 0,
        max_marks: 100,
        achieved_marks: undefined,
        deadline: '',
        status: 'not_started',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create coursework:', error);
      setSubmitError(error.response?.data?.error || 'Failed to create coursework. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        weighting: 0,
        max_marks: 100,
        achieved_marks: undefined,
        deadline: '',
        status: 'not_started',
      });
      setErrors({});
      setWarnings([]);
      setSubmitError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Coursework">
      <form onSubmit={handleSubmit}>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            This will automatically create a task in your calendar if you set a deadline.
          </p>
        </div>

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
          label="Achieved Marks (Optional)"
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
          value={formData.deadline || ''}
          onChange={(value) => setFormData({ ...formData, deadline: value as string })}
          error={errors.deadline}
        />

        <FormField
          label="Status"
          name="status"
          type="select"
          value={formData.status || 'not_started'}
          onChange={(value) => setFormData({ ...formData, status: value as string })}
          error={errors.status}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
        </FormField>

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
            {loading ? 'Creating...' : 'Create Coursework'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
