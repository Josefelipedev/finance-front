// src/components/finance-metrics/AddFinanceModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/modal';
import { CreateFinanceDto, FinanceRecord, useFinance } from '../../hooks/useFinance.ts';
import { useFinanceCategory } from '../../hooks/useFinanceCategory.ts';
import { Controller, useForm } from 'react-hook-form';
import IconPicker from './ui/icon-picker/icon-picker.tsx';
import { CURRENCY_OPTIONS } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext.tsx';
import { useBankAccounts } from '../../hooks/useBankAccounts.ts';

export interface FinancePrefill {
  amount?: number;
  description?: string;
  categoryName?: string;
  type?: 'income' | 'expense';
}

interface AddFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editRecord?: FinanceRecord;
  /** Pré-preenche o formulário (ex.: resultado do scan de recibo) quando não está editando */
  prefill?: FinancePrefill;
}

const defaultValues: CreateFinanceDto = {
  amount: 0,
  type: 'expense',
  description: '',
  categoryId: undefined,
  iconName: 'pricetag',
  referenceDate: new Date().toISOString().split('T')[0],
};

const AddFinanceModal: React.FC<AddFinanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editRecord,
  prefill,
}) => {
  const { addFinanceRecord, updateFinanceRecord, isLoading, error } = useFinance();
  const { categories, getAllCategories } = useFinanceCategory();
  const { user } = useAuth();
  const { accounts, loadAccounts } = useBankAccounts();

  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountFocused, setAmountFocused] = useState(false);

  const isEditMode = Boolean(editRecord);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateFinanceDto>({
    defaultValues,
    mode: 'onChange',
  });

  const amountValue = watch('amount');

  useEffect(() => {
    if (isOpen) {
      getAllCategories({ isActive: true });
      loadAccounts().catch(() => {});

      const userCurrency = user?.currency || 'BRL';

      if (editRecord) {
        const prefill: CreateFinanceDto = {
          amount: editRecord.amount,
          type: editRecord.type,
          currency: editRecord.currency || userCurrency,
          description: editRecord.description || '',
          categoryId: editRecord.categoryId ?? undefined,
          iconName: editRecord.iconName || 'pricetag',
          referenceDate: editRecord.referenceDate
            ? editRecord.referenceDate.split('T')[0]
            : new Date().toISOString().split('T')[0],
        };
        reset(prefill);
        setAmountDisplay(formatBRL(editRecord.amount));
      } else if (prefill) {
        const merged: CreateFinanceDto = {
          ...defaultValues,
          currency: userCurrency,
          amount: prefill.amount ?? 0,
          description: prefill.description ?? '',
          type: prefill.type ?? 'expense',
        };
        reset(merged);
        setAmountDisplay(prefill.amount ? formatBRL(prefill.amount) : '');
      } else {
        reset({ ...defaultValues, currency: userCurrency });
        setAmountDisplay('');
      }
    }
  }, [isOpen, editRecord, prefill]);

  // Casa a categoria sugerida (por nome) assim que as categorias carregam
  useEffect(() => {
    if (!isOpen || editRecord || !prefill?.categoryName || categories.length === 0) return;
    const match = categories.find(
      (c) => c.name.toLowerCase() === prefill.categoryName!.toLowerCase()
    );
    if (match) {
      setValue('categoryId', match.id);
    }
  }, [isOpen, editRecord, prefill, categories, setValue]);

  // Sync display when not focused and value changes externally (e.g. reset)
  useEffect(() => {
    if (!amountFocused && amountValue) {
      setAmountDisplay(formatBRL(amountValue));
    }
  }, [amountValue, amountFocused]);

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      value
    );

  const parseAmount = (raw: string): number => {
    // Accept "1.500,50" (BRL) or "1500.50" (plain) or "1500,50"
    const cleaned = raw.trim();
    // BRL format: dots as thousands, comma as decimal
    if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(cleaned)) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    }
    // Plain with comma as decimal
    return parseFloat(cleaned.replace(',', '.')) || 0;
  };

  const onSubmit = async (data: CreateFinanceDto) => {
    try {
      if (isEditMode && editRecord) {
        await updateFinanceRecord(editRecord.id, data);
      } else {
        await addFinanceRecord(data);
      }
      onSuccess?.();
      reset(defaultValues);
      setAmountDisplay('');
      if (isOpen && onClose) onClose();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          {isEditMode ? 'Editar Transação' : 'Adicionar Transação'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-200">
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Tipo
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Conta (opcional)
              </label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : undefined;
                      field.onChange(id);
                      const account = accounts.find((a) => a.id === id);
                      if (account) setValue('currency', account.currency);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sem conta</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bankName} ({a.currency})
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Moeda
              </label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} — {c.symbol}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Valor
              </label>
              <Controller
                name="amount"
                control={control}
                rules={{
                  required: 'Valor é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                }}
                render={({ field }) => (
                  <div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountDisplay}
                      onChange={(e) => {
                        // Allow only digits, dots, commas
                        const raw = e.target.value.replace(/[^\d,.]/g, '');
                        setAmountDisplay(raw);
                        field.onChange(parseAmount(raw));
                      }}
                      onFocus={() => {
                        setAmountFocused(true);
                        // Show plain number for easy editing
                        if (field.value) {
                          setAmountDisplay(String(field.value).replace('.', ','));
                        }
                      }}
                      onBlur={() => {
                        setAmountFocused(false);
                        if (field.value) {
                          setAmountDisplay(formatBRL(field.value));
                        }
                        field.onBlur();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0,00"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Descrição
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descrição da transação"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Categoria
              </label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Data da Transação
              </label>
              <Controller
                name="referenceDate"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Ícone
            </label>
            <Controller
              name="iconName"
              control={control}
              render={({ field }) => (
                <IconPicker
                  selectedIcon={field.value || 'pricetag'}
                  onIconChange={field.onChange}
                  className="mt-1"
                />
              )}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {isEditMode ? 'Salvando...' : 'Adicionando...'}
                </span>
              ) : isEditMode ? (
                'Salvar Alterações'
              ) : (
                'Adicionar Transação'
              )}
            </button>

            {isOpen && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddFinanceModal;
