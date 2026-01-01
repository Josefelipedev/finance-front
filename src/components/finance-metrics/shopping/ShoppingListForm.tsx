// src/components/finance-metrics/shopping/ShoppingListForm.tsx
import React, { useState, useEffect } from 'react';
import { ShoppingList, useShopping } from '../../../hooks/useShopping';

interface ShoppingListFormProps {
  list?: ShoppingList | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ShoppingListForm: React.FC<ShoppingListFormProps> = ({ list, onSuccess, onCancel }) => {
  const { createList, updateList, isLoading, error } = useShopping();
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (list) {
      setName(list.name);
    }
  }, [list]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setFormError('O nome da lista é obrigatório');
      return;
    }

    setFormError(null);

    try {
      if (list) {
        // Chama a API REAL para atualizar
        await updateList(list.id, { name });
      } else {
        // Chama a API REAL para criar
        await createList({ name });
      }
      onSuccess();
    } catch (err) {
      console.error('Erro ao salvar lista:', err);
      setFormError('Erro ao salvar lista. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {list ? 'Editar Lista' : 'Nova Lista de Compras'}
            </h3>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome da Lista *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
                placeholder="Ex: Compras do Mês, Supermercado, Feira"
                required
              />
            </div>

            {formError && <div className="text-red-500 text-sm">{formError}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Salvando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {list ? 'Salvar Alterações' : 'Criar Lista'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShoppingListForm;
