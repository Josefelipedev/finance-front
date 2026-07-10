// src/components/ui/DatePicker.tsx
import React, { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DatePickerProps {
  value: string; // ISO string
  onChange: (date: string) => void; // Returns ISO string
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string; // ISO string
  maxDate?: string; // ISO string
  className?: string;
  error?: string;
  showTime?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Selecione uma data',
  required = false,
  disabled = false,
  minDate,
  maxDate,
  className = '',
  error,
  showTime = false,
}) => {
  // Converter ISO para yyyy-MM-dd ou yyyy-MM-ddThh:mm
  const formatForInput = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      if (!isValid(date)) return '';

      if (showTime) {
        // Formato para datetime-local
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 16);
      }

      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Converter do input para ISO
  const parseFromInput = (inputValue: string): string => {
    if (!inputValue) return '';

    try {
      if (showTime) {
        // datetime-local retorna no formato yyyy-MM-ddThh:mm
        const date = new Date(inputValue);
        return date.toISOString();
      }

      // date retorna yyyy-MM-dd
      const date = new Date(inputValue + 'T00:00:00');
      return date.toISOString();
    } catch {
      return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const isoDate = parseFromInput(inputValue);
    onChange(isoDate);
  };

  // Formatar para exibição amigável
  const formatForDisplay = (isoDate: string): string => {
    if (!isoDate) return '';

    try {
      const date = parseISO(isoDate);
      if (!isValid(date)) return '';

      if (showTime) {
        return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
      }

      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '';
    }
  };

  const inputValue = formatForInput(value);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type={showTime ? 'datetime-local' : 'date'}
          value={inputValue}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          min={minDate ? formatForInput(minDate) : undefined}
          max={maxDate ? formatForInput(maxDate) : undefined}
          className={`
            w-full px-3 py-2 border rounded-lg transition-colors
            ${
              error
                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                : 'border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
            }
            dark:bg-gray-700 dark:border-gray-600 dark:text-white
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            dark:disabled:bg-gray-800 dark:disabled:text-gray-400
            ${className}
          `}
          placeholder={placeholder}
        />

        {!showTime && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <i className="fas fa-calendar text-gray-400"></i>
          </div>
        )}
      </div>

      {value && !error && <p className="text-xs text-gray-500 mt-1">{formatForDisplay(value)}</p>}

      {error && (
        <p className="text-xs text-rose-500 mt-1">
          <i className="fas fa-exclamation-circle mr-1"></i>
          {error}
        </p>
      )}
    </div>
  );
};

export default DatePicker;
