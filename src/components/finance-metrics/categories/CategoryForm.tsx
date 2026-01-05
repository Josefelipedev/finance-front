// src/components/finance-metrics/categories/CategoryForm.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFinanceCategory, FinanceCategory } from '../../../hooks/useFinanceCategory';
import IconPicker from '../ui/icon-picker/icon-picker.tsx';

// Schema de validação com Zod
const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'O nome é obrigatório')
    .max(50, 'O nome deve ter no máximo 50 caracteres')
    .transform((val) => val.trim()),
  iconName: z
    .string()
    .min(1, 'O ícone é obrigatório')
    .startsWith('fas fa-', { message: 'Formato de ícone inválido' }),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, { message: 'Cor inválida. Use formato hexadecimal (#RRGGBB)' }),
  description: z
    .string()
    .max(200, 'A descrição deve ter no máximo 200 caracteres')
    .transform((val) => val?.trim() || ''),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: FinanceCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSuccess, onCancel }) => {
  const { createCategory, updateCategory, isLoading } = useFinanceCategory();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      iconName: 'fas fa-circle',
      color: '#6B7280',
      description: '',
    },
    mode: 'onChange',
  });

  // Observar valores para pré-visualização
  const name = watch('name');
  const iconName = watch('iconName');
  const color = watch('color');
  const description = watch('description');

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        iconName: category.iconName || 'fas fa-circle',
        color: category.color || '#6B7280',
        description: category.description || '',
      });
    }
  }, [category, reset]);

  // Extrair o nome do ícone para o IconPicker (remover 'fas fa-' prefixo)
  const getIconName = (fullIconName: string) => {
    return fullIconName.replace('fas fa-', '');
  };

  // Converter para o formato completo ao selecionar
  const handleIconSelect = (icon: string) => {
    setValue('iconName', `fas fa-${icon}`, { shouldValidate: true });
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const categoryData = {
        name: data.name,
        iconName: data.iconName,
        color: data.color,
        description: data.description,
        isActive: category?.isActive ?? true,
      };

      if (category) {
        await updateCategory(category.id, categoryData);
      } else {
        await createCategory(categoryData);
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      // Aqui você pode adicionar tratamento de erro específico, como mostrar uma mensagem
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {category ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              type="button"
              aria-label="Fechar"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Nome da Categoria */}
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Nome da Categoria *
              </label>
              <input
                id="category-name"
                type="text"
                {...register('name')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 dark:bg-slate-700 dark:border-slate-600 ${
                  errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Alimentação, Salário, Transporte..."
                maxLength={50}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Insira um nome descritivo para a categoria
              </p>
            </div>

            {/* Seletor de Ícones */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Escolha um Ícone *
              </label>
              <IconPicker
                selectedIcon={getIconName(iconName)}
                onIconChange={handleIconSelect}
                className="border rounded-lg p-4 dark:border-slate-700"
              />
              <input type="hidden" {...register('iconName')} />
              {errors.iconName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.iconName.message}
                </p>
              )}
            </div>

            {/* Cor e Pré-visualização */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Pré-visualização */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: color + '20' }}
                  >
                    <i className={`${iconName} text-2xl`} style={{ color }}></i>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {name || 'Nome da Categoria'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Visualização da categoria
                    </p>
                  </div>
                </div>

                {/* Seletor de Cor */}
                <div className="flex items-center gap-3">
                  <div>
                    <label
                      htmlFor="category-color"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Cor *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="category-color"
                        type="color"
                        {...register('color')}
                        className={`w-10 h-10 cursor-pointer bg-transparent ${
                          errors.color ? 'border border-red-500 rounded' : ''
                        }`}
                        title="Escolher cor"
                      />
                      <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                        {color}
                      </span>
                    </div>
                    {errors.color && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.color.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label
                htmlFor="category-description"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Descrição (opcional)
              </label>
              <textarea
                id="category-description"
                {...register('description')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 dark:bg-slate-700 dark:border-slate-600 ${
                  errors.description ? 'border-red-500 dark:border-red-500' : 'border-gray-300'
                }`}
                placeholder="Descrição da categoria..."
                rows={3}
                maxLength={200}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
              <div className="flex justify-between mt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Máximo de 200 caracteres
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {description.length}/200
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[140px]"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Salvando...
                  </>
                ) : category ? (
                  'Salvar Alterações'
                ) : (
                  'Criar Categoria'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
