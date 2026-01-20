/**
 * InlineMarkEditor - Inline editing component for coursework marks
 */
import { useState, useEffect, useRef } from 'react';

interface InlineMarkEditorProps {
  value: number | null;
  maxMarks: number;
  onSave: (value: number | null) => Promise<void>;
  isLoading?: boolean;
}

export default function InlineMarkEditor({
  value,
  maxMarks,
  onSave,
  isLoading = false
}: InlineMarkEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value?.toString() || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();

    // Allow empty string to clear marks
    if (trimmedValue === '') {
      setIsSaving(true);
      try {
        await onSave(null);
        setIsEditing(false);
        setError(null);
      } catch (err) {
        setError('Failed to update marks');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const numValue = parseFloat(trimmedValue);

    // Validate number
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
      return;
    }

    if (numValue < 0) {
      setError('Marks cannot be negative');
      return;
    }

    if (numValue > maxMarks) {
      setError(`Marks cannot exceed ${maxMarks}`);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(numValue);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Failed to update marks');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSaving}
          />
          <span className="text-sm text-gray-500">/ {maxMarks}</span>
          {isSaving && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          )}
        </div>
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleEdit}
      disabled={isLoading}
      className="group flex items-center gap-2 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
    >
      <span className={`font-medium ${value === null ? 'text-gray-400 italic' : 'text-gray-900'}`}>
        {value === null ? 'Not graded' : value}
      </span>
      <span className="text-sm text-gray-500">/ {maxMarks}</span>
      <svg
        className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </button>
  );
}
