/**
 * Edit Module Modal Component
 * Form for editing an existing module with pre-populated data
 */
import { useState, useEffect } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import { degreesAPI } from '../../api/degrees';
import type { Module, ModuleFormData } from '../../types/degrees';

interface EditModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: Module;
  onSuccess: () => void;
}

export default function EditModuleModal({ isOpen, onClose, module, onSuccess }: EditModuleModalProps) {
  const [formData, setFormData] = useState<ModuleFormData & { status: string }>({
    code: '',
    name: '',
    credits: 0,
    weighting: undefined,
    semester: undefined,
    academic_year: '',
    status: 'upcoming',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Pre-populate form with existing module data
  useEffect(() => {
    if (module) {
      setFormData({
        code: module.code || '',
        name: module.name,
        credits: module.credits,
        weighting: module.weighting,
        semester: module.semester,
        academic_year: module.academic_year || '',
        status: module.status,
      });
    }
  }, [module]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name required
    if (!formData.name.trim()) {
      newErrors.name = 'Module name is required';
    }

    // Credits > 0
    if (!formData.credits || formData.credits <= 0) {
      newErrors.credits = 'Credits must be greater than 0';
    }

    // Weighting 0-100 if provided
    if (formData.weighting !== undefined && (formData.weighting < 0 || formData.weighting > 100)) {
      newErrors.weighting = 'Weighting must be between 0 and 100';
    }

    // Semester 1-3 if provided
    if (formData.semester !== undefined && (formData.semester < 1 || formData.semester > 3)) {
      newErrors.semester = 'Semester must be between 1 and 3';
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
      const submitData = {
        code: formData.code || undefined,
        name: formData.name,
        credits: formData.credits,
        weighting: formData.weighting || undefined,
        semester: formData.semester || undefined,
        academic_year: formData.academic_year || undefined,
      };

      // Update module
      await degreesAPI.updateModule(module.id, submitData);

      // Update status separately if changed
      if (formData.status !== module.status) {
        await degreesAPI.updateModule(module.id, { status: formData.status } as any);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update module:', error);
      setSubmitError(error.response?.data?.error || 'Failed to update module. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErrors({});
      setSubmitError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Module">
      <form onSubmit={handleSubmit}>
        <FormField
          label="Module Code"
          name="code"
          type="text"
          value={formData.code || ''}
          onChange={(value) => setFormData({ ...formData, code: value as string })}
          placeholder="e.g., CS101"
          error={errors.code}
        />

        <FormField
          label="Module Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value as string })}
          placeholder="e.g., Introduction to Computer Science"
          required
          error={errors.name}
        />

        <FormField
          label="Credits"
          name="credits"
          type="number"
          value={formData.credits || ''}
          onChange={(value) => setFormData({ ...formData, credits: value as number })}
          placeholder="e.g., 15"
          required
          min={0}
          error={errors.credits}
        />

        <FormField
          label="Weighting (%)"
          name="weighting"
          type="number"
          value={formData.weighting || ''}
          onChange={(value) => setFormData({ ...formData, weighting: value as number || undefined })}
          placeholder="e.g., 100"
          min={0}
          max={100}
          error={errors.weighting}
          info="Percentage contribution to overall degree grade"
        />

        <FormField
          label="Semester"
          name="semester"
          type="select"
          value={formData.semester || ''}
          onChange={(value) => setFormData({ ...formData, semester: value ? Number(value) : undefined })}
          error={errors.semester}
        >
          <option value="">Select Semester</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
          <option value="3">Semester 3 (Summer)</option>
        </FormField>

        <FormField
          label="Academic Year"
          name="academic_year"
          type="text"
          value={formData.academic_year || ''}
          onChange={(value) => setFormData({ ...formData, academic_year: value as string })}
          placeholder="e.g., 2024/25"
          error={errors.academic_year}
        />

        <FormField
          label="Status"
          name="status"
          type="select"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value as string })}
          error={errors.status}
        >
          <option value="upcoming">Upcoming</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
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
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
