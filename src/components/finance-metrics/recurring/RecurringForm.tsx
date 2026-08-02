// src/components/finance-metrics/recurring/RecurringForm.tsx
import React, { useState, useEffect } from 'react';
import {
  useRecurringFinance,
  RecurringTransaction,
  CreateRecurringTransactionDto,
} from '../../../hooks/useRecurringFinance';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { CURRENCY_OPTIONS, currencyOption } from '../../../utils/currency';
import CategorySelect from '../../form/CategorySelect';
import MoneyInput from '../../form/MoneyInput';
import DateField from '../../form/DateField';
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
  const [formData, setFormData] = useState<CreateRecurringTransactionDto>({
    description: '',
    amount: 0,
    currency: undefined,
    type: 'expense',
    frequency: 'monthly',
    dueDay: 1,
    weekDay: 0,
    notification: false,
    categoryId: 0,
    startDate: '',
    endDate: '',
    occurrences: undefined,
  });
  const currencySymbol = currencyOption(formData.currency ?? profile?.currency).symbol;

  const [errors, setErrors] = useState<Record<string, string>>({});
  // Erro vindo do servidor. Sem isto, um 400 era só um console.error: o modal
  // ficava aberto, o botão voltava ao normal e nada dizia que falhou.
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  // Default de moeda = moeda do perfil (só enquanto o usuário não escolheu)
  useEffect(() => {
    if (!transaction && profile?.currency) {
      setFormData((prev) => (prev.currency ? prev : { ...prev, currency: profile.currency }));
    }
  }, [profile?.currency, transaction]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
        frequency: transaction.frequency,
        dueDay: transaction.dueDay || 1,
        weekDay: transaction.weekDay || 0,
        notification: transaction.notification,
        categoryId: transaction.categoryId ?? transaction.category?.id ?? 0,
        // A API devolve a data completa ("2026-11-12T00:00:00.000Z") e um
        // <input type="date"> só aceita "AAAA-MM-DD" — com o ISO inteiro o
        // browser descarta o valor e mostra o campo VAZIO, que é o que fazia a
        // data de término parecer nunca gravada.
        startDate: transaction.startDate ? transaction.startDate.slice(0, 10) : '',
        endDate: transaction.endDate ? transaction.endDate.slice(0, 10) : '',
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
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    const payload = {
      ...formData,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };

    try {
      if (transaction) {
        await updateRecurringTransaction(transaction.id, payload);
      } else {
        await createRecurringTransaction(payload);
      }
      onSuccess();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.'
      );
    }
  };

  const handleChange = (field: keyof CreateRecurringTransactionDto, value: any) => {
    setSubmitError(null);
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

            {/* Moeda + Valor */}
            <div className="grid grid-cols-[8.5rem_1fr] gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Moeda
                </label>
                <select
                  value={formData.currency ?? profile?.currency ?? 'BRL'}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor *
                </label>
                <MoneyInput
                  value={formData.amount}
                  onChange={(v) => handleChange('amount', v)}
                  currencySymbol={currencySymbol}
                  error={!!errors.amount}
                />
                {errors.amount && <p className="text-error-500 text-sm mt-1">{errors.amount}</p>}
              </div>
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

            {/* Mês de Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Início (opcional)
              </label>
              <DateField
                id="recurring-start"
                value={formData.startDate || ''}
                onChange={(v) => handleChange('startDate', v)}
                placeholder="dd/mm/aaaa"
                clearable
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.frequency === 'yearly'
                  ? 'O mês desta data é o mês em que vence todos os anos. Vazio = o mês atual.'
                  : 'Conta a partir do mês desta data — o dia é o do vencimento acima. Vazio = começa neste mês; um mês passado gera as contas em atraso desde lá.'}
              </p>
            </div>

            {/* Data de Término */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Término (opcional)
              </label>
              <DateField
                id="recurring-end"
                value={formData.endDate || ''}
                onChange={(v) => handleChange('endDate', v)}
                placeholder="dd/mm/aaaa"
                clearable
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

            {submitError && (
              <div className="rounded-lg border border-error-500 bg-error-50 px-3 py-2 dark:bg-error-500/10">
                <p className="text-error-500 text-sm">{submitError}</p>
              </div>
            )}

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
