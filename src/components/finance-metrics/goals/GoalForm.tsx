// src/components/finance-metrics/GoalForm.tsx
import React, { useState, useEffect } from 'react';
import { CreateGoalDto, UpdateGoalDto } from '../../../hooks/useGoals.ts';
import DateRangePicker from '../../ui/date-range-picker';

interface GoalFormProps {
  initialData?: CreateGoalDto;
  onSubmit: (data: CreateGoalDto | UpdateGoalDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const GoalForm: React.FC<GoalFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateGoalDto>({
    name: '',
    description: '',
    targetValue: 0,
    currentValue: 0,
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));

    // Limpar erro quando o usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'O nome da meta é obrigatório';
    }

    if (formData.targetValue <= 0) {
      newErrors.targetValue = 'O valor alvo deve ser maior que zero';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end <= start) {
        newErrors.endDate = 'A data final deve ser após a data inicial';
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

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Nome da Meta *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-colors ${
            errors.name ? 'border-rose-500' : 'border-slate-300'
          }`}
          placeholder="Ex: Reserva de emergência"
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Descrição
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none transition-colors"
          placeholder="Descreva sua meta..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Valor Alvo (R$) *
          </label>
          <input
            type="number"
            name="targetValue"
            value={formData.targetValue || ''}
            onChange={handleChange}
            required
            min="0.01"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-colors ${
              errors.targetValue ? 'border-rose-500' : 'border-slate-300'
            }`}
            placeholder="0,00"
          />
          {errors.targetValue && <p className="text-xs text-rose-500 mt-1">{errors.targetValue}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Valor Atual (R$)
          </label>
          <input
            type="number"
            name="currentValue"
            value={formData.currentValue || ''}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-colors"
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Usando DateRangePicker */}
      <DateRangePicker
        startDate={formData.startDate}
        endDate={formData.endDate}
        onStartDateChange={(date) => {
          setFormData((prev) => ({ ...prev, startDate: date }));
          if (errors.endDate) {
            setErrors((prev) => ({ ...prev, endDate: '' }));
          }
        }}
        onEndDateChange={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
        startLabel="Data Início"
        endLabel="Data Final"
        startError={errors.startDate}
        endError={errors.endDate}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-colors"
        >
          <option value="ACTIVE">Ativa</option>
          <option value="COMPLETED">Concluída</option>
          <option value="CANCELED">Cancelada</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Salvando...</span>
            </span>
          ) : initialData ? (
            'Atualizar'
          ) : (
            'Criar'
          )}
        </button>
      </div>
    </form>
  );
};

export default GoalForm;
