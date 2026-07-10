// src/components/finance-metrics/recurring/RecurringForm.tsx
import React, { useState, useEffect } from 'react';
import {
  useRecurringFinance,
  RecurringTransaction,
  CreateRecurringTransactionDto,
} from '../../../hooks/useRecurringFinance';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { currencyOption } from '../../../utils/currency';
import CategorySelect from '../../form/CategorySelect';
import { Modal } from '../../ui/modal';
import Button from '../../ui/button/Button';

interface RecurringFormProps {
  transaction?: RecurringTransaction | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const RecurringForm: React.FC<RecurringFormProps> = ({ transaction, onSuccess, onCancel }) => {
  const { createRecurringTransaction, updateRecurringTransaction, isLoading } =
    useRecurringFinance();
  const { profile, getProfile } = useUserProfile();
  const currencySymbol = currencyOption(profile?.currency).symbol;
  const [formData, setFormData] = useState<CreateRecurringTransactionDto>({
    description: '',
    amount: 0,
    type: 'expense',
    frequency: 'monthly',
    dueDay: 1,
    weekDay: 0,
    notification: false,
    categoryId: 0,
    endDate: '',
    occurrences: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

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
        categoryId: transaction.categoryId ?? transaction.category?.id ?? 0,
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

    if (!formData.categoryId) {
      newErrors.categoryId = 'Categoria é obrigatória';
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
    <Modal isOpen onClose={onCancel} className="max-w-md max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="mb-6 pr-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {transaction ? 'Editar Transação Recorrente' : 'Nova Transação Recorrente'}
          </h3>
        </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.description ? 'border-error-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Salário, Aluguel, Internet"
              />
              {errors.description && (
                <p className="text-error-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.amount ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                />
              </div>
              {errors.amount && <p className="text-error-500 text-sm mt-1">{errors.amount}</p>}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'income')}
                  className={`px-3 py-2 rounded-lg border flex items-center justify-center gap-2 ${
                    formData.type === 'income'
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                      ? 'bg-red-100 dark:bg-red-900/30 border-error-500 text-red-700 dark:text-red-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <i className="fas fa-arrow-down text-error-500"></i>
                  Despesa
                </button>
              </div>
            </div>

            {/* Frequência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequência *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dia do Vencimento (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDay || 1}
                  onChange={(e) => handleChange('dueDay', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {/* Dia da Semana (para semanal) */}
            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dia da Semana
                </label>
                <select
                  value={formData.weekDay || 0}
                  onChange={(e) => handleChange('weekDay', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria *
              </label>
              <CategorySelect
                value={formData.categoryId || undefined}
                onChange={(id) => handleChange('categoryId', id ?? 0)}
                type={formData.type}
                error={errors.categoryId}
              />
              {errors.categoryId && (
                <p className="text-error-500 text-sm mt-1">{errors.categoryId}</p>
              )}
            </div>

            {/* Data de Término */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Término (opcional)
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Número de Ocorrências */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Ocorrências (opcional)
              </label>
              <input
                type="number"
                min="1"
                value={formData.occurrences || ''}
                onChange={(e) =>
                  handleChange('occurrences', e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
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
                className="h-4 w-4 text-brand-500 rounded focus:ring-brand-500 border-gray-300 dark:border-gray-600"
              />
              <label
                htmlFor="notification"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Enviar notificação antes do vencimento
              </label>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading}>
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
              </Button>
            </div>
          </form>
      </div>
    </Modal>
  );
};

export default RecurringForm;
