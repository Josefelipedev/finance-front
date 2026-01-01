import React, { useState, useEffect } from 'react';
import { useFinanceCategory, FinanceCategory } from '../../../hooks/useFinanceCategory';
import CategoryForm from './CategoryForm.tsx';
import CategoryList from './CategoryList.tsx';
import { useDefaultIcons } from '../../../hooks/useDefaultIcons.ts';

const CategoryManager: React.FC = () => {
  const { categories, getAllCategories, deleteCategory, toggleCategoryStatus, isLoading, error } =
    useFinanceCategory();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    await getAllCategories({ isActive: true });
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleCategoryStatus(id);
      await loadCategories();
    } catch (error) {
      console.error('Erro ao alternar status:', error);
    }
  };

  const handleEdit = (category: FinanceCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm(
        'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.'
      )
    ) {
      try {
        await deleteCategory(id);
        await loadCategories();
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    loadCategories();
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500 text-xl"></i>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              Erro ao carregar categorias
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
            <button
              onClick={loadCategories}
              className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Gerenciar Categorias
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Organize suas categorias de receitas e despesas
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <i className="fas fa-plus"></i>
          Nova Categoria
        </button>
      </div>

      <CategoryList
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {isFormOpen && (
        <CategoryForm
          category={editingCategory}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
};

export default CategoryManager;
