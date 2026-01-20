/**
 * Add Lecture Modal Component
 * Form for creating recurring lecture events
 */
import { useState } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import { degreesAPI } from '../../api/degrees';
import type { LectureFormData } from '../../types/degrees';

interface AddLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
}

export default function AddLectureModal({ isOpen, onClose, moduleId, onSuccess }: AddLectureModalProps) {
  const [formData, setFormData] = useState<LectureFormData>({
    title: '',
    location: '',
    day_of_week: 0,
    start_time: '',
    end_time: '',
    recurrence_start_date: '',
    recurrence_end_date: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title required
    if (!formData.title.trim()) {
      newErrors.title = 'Lecture title is required';
    }

    // Times required
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    // Start time must be before end time
    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    // Recurrence dates required
    if (!formData.recurrence_start_date) {
      newErrors.recurrence_start_date = 'Start date is required';
    }

    // End date must be after start date if provided
    if (formData.recurrence_start_date && formData.recurrence_end_date) {
      if (formData.recurrence_end_date < formData.recurrence_start_date) {
        newErrors.recurrence_end_date = 'End date must be after start date';
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
      const submitData: LectureFormData = {
        title: formData.title,
        location: formData.location || undefined,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        recurrence_start_date: formData.recurrence_start_date,
        recurrence_end_date: formData.recurrence_end_date || undefined,
        notes: formData.notes || undefined,
      };

      await degreesAPI.createLecture(moduleId, submitData);

      // Reset form
      setFormData({
        title: '',
        location: '',
        day_of_week: 0,
        start_time: '',
        end_time: '',
        recurrence_start_date: '',
        recurrence_end_date: '',
        notes: '',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create lecture:', error);
      setSubmitError(error.response?.data?.error || 'Failed to create lecture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        location: '',
        day_of_week: 0,
        start_time: '',
        end_time: '',
        recurrence_start_date: '',
        recurrence_end_date: '',
        notes: '',
      });
      setErrors({});
      setSubmitError('');
      onClose();
    }
  };

  const daysOfWeek = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Lecture" maxWidth="lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            This will create recurring calendar events for all weeks between the start and end dates.
          </p>
        </div>

        <FormField
          label="Lecture Title"
          name="title"
          type="text"
          value={formData.title}
          onChange={(value) => setFormData({ ...formData, title: value as string })}
          placeholder="e.g., Computer Science Lecture"
          required
          error={errors.title}
        />

        <FormField
          label="Location"
          name="location"
          type="text"
          value={formData.location || ''}
          onChange={(value) => setFormData({ ...formData, location: value as string })}
          placeholder="e.g., Room 101, Building A"
          error={errors.location}
        />

        <FormField
          label="Day of Week"
          name="day_of_week"
          type="select"
          value={formData.day_of_week}
          onChange={(value) => setFormData({ ...formData, day_of_week: Number(value) })}
          required
          error={errors.day_of_week}
        >
          {daysOfWeek.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Start Time"
            name="start_time"
            type="time"
            value={formData.start_time}
            onChange={(value) => setFormData({ ...formData, start_time: value as string })}
            required
            error={errors.start_time}
          />

          <FormField
            label="End Time"
            name="end_time"
            type="time"
            value={formData.end_time}
            onChange={(value) => setFormData({ ...formData, end_time: value as string })}
            required
            error={errors.end_time}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Recurrence Start Date"
            name="recurrence_start_date"
            type="date"
            value={formData.recurrence_start_date}
            onChange={(value) => setFormData({ ...formData, recurrence_start_date: value as string })}
            required
            error={errors.recurrence_start_date}
            info="First week of lectures"
          />

          <FormField
            label="Recurrence End Date"
            name="recurrence_end_date"
            type="date"
            value={formData.recurrence_end_date || ''}
            onChange={(value) => setFormData({ ...formData, recurrence_end_date: value as string })}
            error={errors.recurrence_end_date}
            info="Last week (optional)"
          />
        </div>

        <FormField
          label="Notes"
          name="notes"
          type="textarea"
          value={formData.notes || ''}
          onChange={(value) => setFormData({ ...formData, notes: value as string })}
          placeholder="Additional notes about the lecture"
          rows={3}
          error={errors.notes}
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
            {loading ? 'Creating...' : 'Create Lecture'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
