// src/components/ui/DateRangePicker.tsx
import React from 'react';
import DatePicker, { DatePickerProps } from './DatePicker';

export interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  startLabel?: string;
  endLabel?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  startError?: string;
  endError?: string;
  minDate?: string;
  maxDate?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Data Inicial',
  endLabel = 'Data Final',
  required = false,
  disabled = false,
  className = '',
  startError,
  endError,
  minDate,
  maxDate,
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <DatePicker
        value={startDate}
        onChange={onStartDateChange}
        label={startLabel}
        required={required}
        disabled={disabled}
        minDate={minDate}
        maxDate={endDate} // A data inicial não pode ser depois da final
        error={startError}
      />

      <DatePicker
        value={endDate}
        onChange={onEndDateChange}
        label={endLabel}
        required={required}
        disabled={disabled}
        minDate={startDate} // A data final não pode ser antes da inicial
        maxDate={maxDate}
        error={endError}
      />
    </div>
  );
};

export default DateRangePicker;
