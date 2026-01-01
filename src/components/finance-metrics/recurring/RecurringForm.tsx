// src/components/finance-metrics/recurring/RecurringForm.tsx
import React, { useState, useEffect } from 'react';
import {
  useRecurringFinance,
  RecurringTransaction,
  CreateRecurringTransactionDto,
} from '../../../hooks/useRecurringFinance';

interface RecurringFormProps {
  transaction?: RecurringTransaction | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const RecurringForm: React.FC<RecurringFormProps> = ({ transaction, onSuccess, onCancel }) => {
  const { createRecurringTransaction, updateRecurringTransaction, isLoading } =
    useRecurringFinance();
  const [formData, setFormData] = useState<CreateRecurringTransactionDto>({
    description: '',
    amount: 0,
    type: 'expense',
    frequency: 'monthly',
    dueDay: 1,
    weekDay: 0,
    notification: false,
    categoria: '',
    endDate: '',
    occurrences: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        frequency: transaction.frequency,
        dueDay: transaction.dueDay || 1,
        weekDay: transaction.weekDay || 0,
        notification: transaction.notification,
        categoria: transaction.category?.name || '',
        endDate: transaction.endDate || '',
        occurrences: transaction.occurrences,
      });
    }
  }, [transaction]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.categoria.trim()) {
      newErrors.categoria = 'Categoria é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (transaction) {
        await updateRecurringTransaction(transaction.id, formData);
      } else {
        await createRecurringTransaction(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar transação recorrente:', error);
    }
  };

  const handleChange = (field: keyof CreateRecurringTransactionDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {transaction ? 'Editar Transação Recorrente' : 'Nova Transação Recorrente'}
            </h3>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                  errors.description ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Ex: Salário, Aluguel, Internet"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Valor *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                    errors.amount ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="0,00"
                />
              </div>
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'income')}
                  className={`px-3 py-2 rounded-lg border flex items-center justify-center gap-2 ${
                    formData.type === 'income'
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300'
                      : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <i className="fas fa-arrow-up text-green-500"></i>
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('type', 'expense')}
                  className={`px-3 py-2 rounded-lg border flex items-center justify-center gap-2 ${
                    formData.type === 'expense'
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300'
                      : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <i className="fas fa-arrow-down text-red-500"></i>
                  Despesa
                </button>
              </div>
            </div>

            {/* Frequência */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Frequência *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            {/* Dia do Vencimento (para mensal) */}
            {formData.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dia do Vencimento (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDay || 1}
                  onChange={(e) => handleChange('dueDay', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            )}

            {/* Dia da Semana (para semanal) */}
            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dia da Semana
                </label>
                <select
                  value={formData.weekDay || 0}
                  onChange={(e) => handleChange('weekDay', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value={0}>Domingo</option>
                  <option value={1}>Segunda-feira</option>
                  <option value={2}>Terça-feira</option>
                  <option value={3}>Quarta-feira</option>
                  <option value={4}>Quinta-feira</option>
                  <option value={5}>Sexta-feira</option>
                  <option value={6}>Sábado</option>
                </select>
              </div>
            )}

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoria *
              </label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                  errors.categoria ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Ex: Salário, Aluguel"
              />
              {errors.categoria && <p className="text-red-500 text-sm mt-1">{errors.categoria}</p>}
            </div>

            {/* Data de Término */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Data de Término (opcional)
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Número de Ocorrências */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Número de Ocorrências (opcional)
              </label>
              <input
                type="number"
                min="1"
                value={formData.occurrences || ''}
                onChange={(e) =>
                  handleChange('occurrences', e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
                placeholder="Deixe vazio para repetir indefinidamente"
              />
            </div>

            {/* Notificação */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notification"
                checked={formData.notification}
                onChange={(e) => handleChange('notification', e.target.checked)}
                className="h-4 w-4 text-sky-500 rounded focus:ring-sky-500 border-slate-300 dark:border-slate-600"
              />
              <label
                htmlFor="notification"
                className="ml-2 text-sm text-slate-700 dark:text-slate-300"
              >
                Enviar notificação antes do vencimento
              </label>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Salvando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {transaction ? 'Salvar Alterações' : 'Criar Transação'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecurringForm;
