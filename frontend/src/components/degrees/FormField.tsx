/**
 * Reusable Form Field Component
 * Provides consistent form field styling with labels, errors, and various input types
 */
import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'date' | 'datetime-local' | 'time' | 'textarea' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  children?: ReactNode; // For select options
  rows?: number; // For textarea
  info?: string; // Additional info text
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required,
  min,
  max,
  step,
  children,
  rows = 3,
  info,
}: FormFieldProps) {
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-colors
    ${error ? 'border-red-500' : 'border-gray-300'}
  `;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (type === 'number') {
      onChange(e.target.value === '' ? '' : parseFloat(e.target.value));
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={baseInputClasses}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          required={required}
          className={baseInputClasses}
        >
          {children}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className={baseInputClasses}
        />
      )}

      {info && (
        <p className="mt-1 text-xs text-blue-600">{info}</p>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
