import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FinanceCategory } from '../../../hooks/useFinanceCategory';
import IconPicker from '../ui/icon-picker/icon-picker';

// =======================
// Schema
// =======================
const quickEditSchema = z.object({
  name: z.string().min(1).max(50),
  iconName: z.string().min(1),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
});

type QuickEditFormData = z.infer<typeof quickEditSchema>;

// =======================
// List
// =======================
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 text-center">
        <i className="fas fa-tags text-4xl text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma categoria encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
        <i className="fas fa-tags text-sky-500" />
        Categorias
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
};

// =======================
// Card
// =======================
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
    formState: { isValid },
  } = useForm<QuickEditFormData>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: {
      name: category.name,
      iconName: category.iconName || 'fas fa-circle',
      color: category.color || '#6B7280',
    },
    mode: 'onChange',
  });

  const iconName = watch('iconName');
  const color = watch('color');

  const handleIconSelect = (icon: string) =>
    setValue('iconName', `fas fa-${icon}`, { shouldValidate: true });

  const handleSubmitQuick = async (data: QuickEditFormData) => {
    if (!onQuickUpdate) return;
    setIsSubmitting(true);
    await onQuickUpdate(category.id, data);
    setIsSubmitting(false);
    onFinishEdit();
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-sky-200 dark:border-sky-800 p-4">
        <form onSubmit={handleSubmit(handleSubmitQuick)} className="space-y-3">
          <input
            {...register('name')}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
            autoFocus
          />

          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: color + '20' }}
            >
              <i className={`${iconName}`} style={{ color }} />
            </div>

            <IconPicker
              selectedIcon={iconName.replace('fas fa-', '')}
              onIconChange={handleIconSelect}
              className="flex-1"
            />

            <input type="color" {...register('color')} className="w-6 h-6" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                reset();
                onCancelEdit();
              }}
              className="px-3 py-1.5 text-xs rounded-lg border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-3 py-1.5 text-xs rounded-lg bg-sky-500 text-white disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    );
  }

  const displayIcon = category.iconName || 'fas fa-circle';
  const displayColor = category.color || '#6B7280';

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow border p-4 overflow-hidden ${
        !category.isActive ? 'opacity-60' : ''
      }`}
      onDoubleClick={onStartEdit}
    >
      <div className="flex items-start justify-between gap-3">
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: displayColor + '20' }}
          >
            <i className={`${displayIcon}`} style={{ color: displayColor }} />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-slate-800 dark:text-white truncate">{category.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {category.isActive ? 'Ativa' : 'Inativa'}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onToggleStatus(category.id, category.isActive)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <i className={`fas fa-${category.isActive ? 'eye' : 'eye-slash'}`} />
          </button>

          <button
            onClick={onStartEdit}
            className="p-2 rounded-lg text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/20"
          >
            <i className="fas fa-edit" />
          </button>

          <button
            onClick={() => onEdit(category)}
            className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20"
          >
            <i className="fas fa-cog" />
          </button>

          <button
            onClick={() => onDelete(category.id)}
            className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
          >
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>

      {category.description && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-sky-500 flex items-center gap-1"
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} />
            {isExpanded ? 'Ocultar descrição' : 'Mostrar descrição'}
          </button>

          {isExpanded && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {category.description}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryList;
