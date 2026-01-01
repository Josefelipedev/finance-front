// src/components/finance-metrics/shopping/ShoppingItemForm.tsx
import React, { useState, useEffect } from 'react';
import { useShopping, ShoppingItem } from '../../../hooks/useShopping';

interface ShoppingItemFormProps {
  listId: number;
  item?: ShoppingItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ShoppingItemForm: React.FC<ShoppingItemFormProps> = ({
  listId,
  item,
  onSuccess,
  onCancel,
}) => {
  const { createOrUpdateItem, updateItem, addItem, isLoading } = useShopping();
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: 'un',
    price: 0,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Unidades disponíveis
  const availableUnits = [
    { value: 'un', label: 'Unidade' },
    { value: 'kg', label: 'Quilograma' },
    { value: 'g', label: 'Grama' },
    { value: 'l', label: 'Litro' },
    { value: 'ml', label: 'Mililitro' },
    { value: 'cx', label: 'Caixa' },
    { value: 'pct', label: 'Pacote' },
    { value: 'dz', label: 'Dúzia' },
  ];

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        quantity: item.quantity || 1,
        unit: item.unit || 'un',
        price: item.price || 0,
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('O nome do item é obrigatório');
      return;
    }

    if (formData.price < 0) {
      setFormError('O preço não pode ser negativo');
      return;
    }

    setFormError(null);

    try {
      if (item) {
        // Chama a API REAL para atualizar item existente
        await updateItem(item.id, {
          name: formData.name,
          quantity: formData.quantity,
          unit: formData.unit,
          price: formData.price,
        });
      } else {
        // Chama a API REAL para criar novo item
        await createOrUpdateItem({
          name: formData.name,
          quantity: formData.quantity,
          unit: formData.unit,
          price: formData.price,
          shoppingListId: listId,
        });

        // Alternativamente, pode usar addItem:
        // await addItem({
        //   listId,
        //   name: formData.name,
        //   quantity: formData.quantity,
        //   unit: formData.unit,
        //   price: formData.price,
        // });
      }
      onSuccess();
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      setFormError('Erro ao salvar item. Tente novamente.');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {item ? 'Editar Item' : 'Adicionar Item'}
            </h3>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome do Item */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome do Item *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
                placeholder="Ex: Arroz, Leite, Pão"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Quantidade */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Unidade */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Unidade
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
                >
                  {availableUnits.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Preço (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Valor Total */}
            {formData.price > 0 && formData.quantity > 0 && (
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Valor Total:
                  </span>
                  <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                    R$ {(formData.price * formData.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {formError && <div className="text-red-500 text-sm">{formError}</div>}

            {/* Botões */}
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
                    {item ? 'Salvar Alterações' : 'Adicionar Item'}
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

export default ShoppingItemForm;
