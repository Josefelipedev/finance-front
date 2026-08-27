import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useShopping, ShoppingItem } from '../../../hooks/useShopping';
import { Modal } from '../../ui/modal';
import Button from '../../ui/button/Button';
import MoneyInput from '../../form/MoneyInput';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { currencyOption, formatMoney } from '../../../utils/currency';

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
  const { profile } = useUserProfile();
  const currency = profile?.currency;
  const currencySymbol = currencyOption(currency).symbol;
  const { createOrUpdateItem, updateItem, isLoading } = useShopping();
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
      }
      onSuccess();
    } catch (err) {
      const msg = (err as Error).message || 'Erro ao salvar item. Tente novamente.';
      setFormError(msg);
      toast.error(msg);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={true} onClose={onCancel} className="max-w-md max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="mb-6 pr-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {item ? 'Editar Item' : 'Adicionar Item'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Item *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: Arroz, Leite, Pão"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unidade
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preço por unidade
            </label>
            <MoneyInput
              value={formData.price || 0}
              onChange={(v) => handleChange('price', v)}
              currencySymbol={currencySymbol}
            />
            {/*
              Era "Preço Total" e a quantidade não multiplicava nada — três pães
              a 10,00 € somavam 10,00 €. Agora pede-se o preço de UM e mostra-se
              a conta feita, para não haver dúvida sobre o que se está a escrever.
            */}
            <p className="text-xs text-gray-400 mt-1">
              {formData.price > 0 && formData.quantity > 0
                ? `${formData.quantity} × ${formatMoney(formData.price, currency)} = ${formatMoney(
                    formData.price * formData.quantity,
                    currency,
                  )}`
                : 'Preço de uma unidade — o total da linha é este valor × quantidade'}
            </p>
          </div>

          {formError && <div className="text-error-500 text-sm">{formError}</div>}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                  {item ? 'Salvar Alterações' : 'Adicionar Item'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ShoppingItemForm;
