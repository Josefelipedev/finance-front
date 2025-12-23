// src/components/finance-metrics/categories/CategoryForm.tsx (versão simplificada)
import React, { useState, useEffect } from 'react';
import { useFinanceCategory, FinanceCategory } from '../../../hooks/useFinanceCategory';

interface CategoryFormProps {
  category?: FinanceCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSuccess, onCancel }) => {
  const { createCategory, updateCategory, isLoading } = useFinanceCategory();
  const [formData, setFormData] = useState({
    name: '',
    iconName: 'fas fa-tag',
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        iconName: category.iconName || 'fas fa-tag',
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (category) {
        await updateCategory(category.id, formData);
      } else {
        await createCategory(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {category ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome da Categoria *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
                placeholder="Ex: Alimentação"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ícone
              </label>
              <select
                value={formData.iconName}
                onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
              >
                <option value="fas fa-tag">Tag</option>
                <option value="fas fa-home">Casa</option>
                <option value="fas fa-shopping-cart">Compras</option>
                <option value="fas fa-car">Carro</option>
                <option value="fas fa-heart">Saúde</option>
                <option value="fas fa-gamepad">Entretenimento</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border rounded-lg text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
              >
                {category ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
