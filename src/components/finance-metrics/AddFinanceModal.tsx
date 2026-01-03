// src/components/finance-metrics/AddFinanceModal.tsx
import React, { useEffect } from 'react';
import { Modal } from '../ui/modal';
import { CreateFinanceDto, useFinance } from '../../hooks/useFinance.ts';
import { useFinanceCategory } from '../../hooks/useFinanceCategory.ts';
import { Controller, useForm } from 'react-hook-form';
import IconPicker from './ui/icon-picker/icon-picker.tsx'; // Importe o hook

interface AddFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
const defaultValues: CreateFinanceDto = {
  amount: 0,
  type: 'expense',
  description: '',
  categoryId: undefined,
  iconName: 'pricetag',
  referenceDate: new Date().toISOString().split('T')[0],
};

const AddFinanceModal: React.FC<AddFinanceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addFinanceRecord, isLoading, error } = useFinance();
  const { categories, getAllCategories } = useFinanceCategory();
  useEffect(() => {
    if (isOpen) {
      getAllCategories({ isActive: true });
    }
  }, [isOpen]);

  const {
    control,
    handleSubmit,
    reset,
    // setValue,
    // watch,
    formState: { errors },
  } = useForm<CreateFinanceDto>({
    defaultValues,
    mode: 'onChange',
  });

  const onSubmit = async (data: CreateFinanceDto) => {
    try {
      await addFinanceRecord(data);
      onSuccess?.();
      reset(defaultValues);

      if (isOpen && onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
    }
  };
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Adicionar Transação
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
                Valor (R$)
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
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                  Adicionando...
                </span>
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
