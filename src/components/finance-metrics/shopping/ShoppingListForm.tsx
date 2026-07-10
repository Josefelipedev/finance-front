import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ShoppingList, useShopping } from '../../../hooks/useShopping';
import { Modal } from '../../ui/modal';
import Button from '../../ui/button/Button';

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
      const msg = (err as Error).message || 'Erro ao salvar lista. Tente novamente.';
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <Modal isOpen={true} onClose={onCancel} className="max-w-md">
      <div className="p-6">
        <div className="mb-6 pr-8">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            {list ? 'Editar Lista' : 'Nova Lista de Compras'}
          </h3>
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
              <Button variant="primary" disabled={isLoading}>
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
              </Button>
            </div>
        </form>
      </div>
    </Modal>
  );
};

export default ShoppingListForm;
