// src/components/finance-metrics/categories/CategoryList.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FinanceCategory } from '../../../hooks/useFinanceCategory.ts';
import IconPicker from '../ui/icon-picker/icon-picker.tsx';

// Schema de validação para edição rápida
const quickEditSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome é obrigatório')
    .max(50, 'O nome deve ter no máximo 50 caracteres'),
  iconName: z.string().min(1, 'O ícone é obrigatório'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
});

type QuickEditFormData = z.infer<typeof quickEditSchema>;

interface CategoryListProps {
  categories: FinanceCategory[];
  onEdit: (category: FinanceCategory) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onQuickUpdate?: (id: number, data: Partial<FinanceCategory>) => Promise<void>;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  onToggleStatus,
  onQuickUpdate,
}) => {
  const [quickEditId, setQuickEditId] = useState<number | null>(null);

  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8 text-center">
        <i className="fas fa-tags text-4xl text-slate-300 dark:text-slate-600 mb-3"></i>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          Nenhuma categoria encontrada
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Comece criando sua primeira categoria para organizar suas transações
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <i className="fas fa-tags text-blue-500"></i>
          Todas as Categorias
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isEditing={quickEditId === category.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onQuickUpdate={onQuickUpdate}
              onStartEdit={() => setQuickEditId(category.id)}
              onCancelEdit={() => setQuickEditId(null)}
              onFinishEdit={() => setQuickEditId(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface CategoryCardProps {
  category: FinanceCategory;
  isEditing: boolean;
  onEdit: (category: FinanceCategory) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onQuickUpdate?: (id: number, data: Partial<FinanceCategory>) => Promise<void>;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onFinishEdit: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isEditing,
  onEdit,
  onDelete,
  onToggleStatus,
  onQuickUpdate,
  onStartEdit,
  onCancelEdit,
  onFinishEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<QuickEditFormData>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: {
      name: category.name,
      iconName: category.iconName || 'fas fa-circle',
      color: category.color || '#6B7280',
    },
    mode: 'onChange',
  });

  // Observar valores para pré-visualização
  const name = watch('name');
  const iconName = watch('iconName');
  const color = watch('color');

  // Extrair o nome do ícone para o IconPicker
  const getIconName = (fullIconName: string) => {
    return fullIconName.replace('fas fa-', '');
  };

  // Converter para o formato completo ao selecionar
  const handleIconSelect = (icon: string) => {
    setValue('iconName', `fas fa-${icon}`, { shouldValidate: true });
  };

  const handleQuickSubmit = async (data: QuickEditFormData) => {
    if (!onQuickUpdate) return;

    setIsSubmitting(true);
    try {
      await onQuickUpdate(category.id, {
        name: data.name.trim(),
        iconName: data.iconName,
        color: data.color,
      });
      onFinishEdit();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset({
      name: category.name,
      iconName: category.iconName || 'fas fa-circle',
      color: category.color || '#6B7280',
    });
    onCancelEdit();
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-sky-200 dark:border-sky-800 p-4">
        <form onSubmit={handleSubmit(handleQuickSubmit)} className="space-y-3">
          {/* Nome da Categoria */}
          <div>
            <input
              {...register('name')}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="Nome da categoria"
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Seletor de Ícone e Cor */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + '20' }}
              >
                <i className={`${iconName} text-sm`} style={{ color }}></i>
              </div>
              <div className="flex-1">
                <IconPicker
                  selectedIcon={getIconName(iconName)}
                  onIconChange={handleIconSelect}
                  className="border-none p-0"
                />
                <input type="hidden" {...register('iconName')} />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  {...register('color')}
                  className="w-6 h-6 cursor-pointer bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-3 py-1.5 text-xs bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Se a categoria não tem ícone, usar um padrão
  const displayIconName = category.iconName || 'fas fa-circle';
  const displayColor = category.color || '#6B7280';

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow border p-4 transition-all hover:shadow-md ${
        !category.isActive ? 'opacity-60' : ''
      }`}
      onDoubleClick={onStartEdit}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: displayColor + '20' }}
          >
            <i className={`${displayIconName} text-lg`} style={{ color: displayColor }}></i>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-white">{category.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  category.isActive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}
              >
                {category.isActive ? 'Ativa' : 'Inativa'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(category.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onToggleStatus(category.id, category.isActive)}
            className={`p-2 rounded-lg transition-colors ${
              category.isActive
                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
            title={category.isActive ? 'Desativar' : 'Ativar'}
            aria-label={category.isActive ? 'Desativar categoria' : 'Ativar categoria'}
          >
            <i className={`fas fa-${category.isActive ? 'eye' : 'eye-slash'}`}></i>
          </button>
          <button
            onClick={onStartEdit}
            className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
            title="Editar rapidamente"
            aria-label="Editar categoria rapidamente"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Editar detalhes"
            aria-label="Editar detalhes da categoria"
          >
            <i className="fas fa-cog"></i>
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Excluir"
            aria-label="Excluir categoria"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      {category.description && (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1"
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xs`}></i>
            {isExpanded ? 'Ocultar descrição' : 'Mostrar descrição'}
          </button>
          {isExpanded && (
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              {category.description}
            </p>
          )}
        </>
      )}

      {/* Dica de uso */}
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <i className="fas fa-lightbulb mr-1 text-amber-500"></i>
          Dê um duplo clique para editar rapidamente
        </p>
      </div>
    </div>
  );
};

export default CategoryList;
