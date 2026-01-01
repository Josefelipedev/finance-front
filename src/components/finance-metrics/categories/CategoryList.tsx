// src/components/finance-metrics/categories/CategoryList.tsx
import React from 'react';
import { FinanceCategory } from '../../../hooks/useFinanceCategory.ts';
import { useDefaultIcons } from '../../../hooks/useDefaultIcons.ts';

interface CategoryListProps {
  categories: FinanceCategory[];
  onEdit: (category: FinanceCategory) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
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
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CategoryCard: React.FC<{
  category: FinanceCategory;
  onEdit: (category: FinanceCategory) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}> = ({ category, onEdit, onDelete, onToggleStatus }) => {
  const { getIconForCategorySync } = useDefaultIcons();

  // Se a categoria não tem ícone, busca um padrão baseado no nome
  const iconName = category.iconName || getIconForCategorySync(category.name).icon;
  const color = category.color || getIconForCategorySync(category.name).color;
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow border p-4 ${
        !category.isActive ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: category.color + '20' }}
          >
            <i className={`${iconName} text-lg`} style={{ color: color }}></i>
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
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onToggleStatus(category.id, category.isActive)}
            className={`p-2 rounded-lg ${
              category.isActive
                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
            title={category.isActive ? 'Desativar' : 'Ativar'}
          >
            <i className={`fas fa-${category.isActive ? 'eye' : 'eye-slash'}`}></i>
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg"
            title="Editar"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            title="Excluir"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      {category.description && (
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-3">{category.description}</p>
      )}
    </div>
  );
};

export default CategoryList;
