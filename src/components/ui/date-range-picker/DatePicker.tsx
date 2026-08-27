// src/components/ui/DatePicker.tsx
import React, { useId } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateField from '../../form/DateField';
import { localDay } from '../../../utils/civil-date';

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
  /**
   * Trata a data escolhida como o **fim** desse dia (23:59:59.999) em vez do
   * começo. Sem isto, escolher "29/07" como data final excluía o próprio 29/07
   * do período, porque o filtro da API é `lte`.
   */
  endOfDay?: boolean;
}

/**
 * O picker partilhado (o `DateRangePicker` é dois destes lado a lado).
 *
 * Por dentro era um `<input type="date">`, portanto tinha o mesmo problema dos
 * outros campos de data: a ordem que se vê e se escreve é a do locale do
 * BROWSER, e num Chrome em inglês 11/04 é 4 de novembro. A linha de ajuda por
 * baixo (`dd/MM/yyyy`) ajudava a perceber depois de escolher, mas não impedia
 * escrever ao contrário.
 *
 * Passa a delegar no `DateField` (flatpickr em português). O contrato de fora
 * fica igual — entra e sai uma ISO completa — para os quatro ecrãs que já o
 * usam não mudarem nada.
 */
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
  endOfDay = false,
}) => {
  const fieldId = useId();

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

      // O `value` é um instante que representa a MEIA-NOITE LOCAL. Lê-lo em UTC
      // devolve o dia anterior a leste de Greenwich, e o campo passava a
      // discordar da legenda logo por baixo (que já formatava em local). Pior:
      // confirmar no calendário o dia que ele mostrava recuava o período um dia
      // de cada vez.
      return localDay(date);
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
      const date = new Date(inputValue + (endOfDay ? 'T23:59:59.999' : 'T00:00:00'));
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
        {showTime ? (
          // Caminho com hora: continua nativo (nenhum ecrã o usa hoje).
          <input
            type="datetime-local"
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
        ) : (
          <DateField
            id={fieldId}
            value={inputValue}
            onChange={(v) => onChange(parseFromInput(v))}
            placeholder={placeholder}
          />
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
