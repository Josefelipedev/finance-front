// src/components/finance-metrics/shopping/ShoppingListItem.tsx
import React, { useState } from 'react';
import { ShoppingItem } from '../../../hooks/useShopping';

interface ShoppingListItemProps {
  item: ShoppingItem;
  onToggleStatus: (itemId: number, purchased: boolean) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (itemId: number) => void;
  onViewHistory: (itemId: number) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({
  item,
  onToggleStatus,
  onEdit,
  onDelete,
  onViewHistory,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getUnitLabel = (unit: string) => {
    const units: Record<string, string> = {
      un: 'un',
      kg: 'kg',
      g: 'g',
      l: 'L',
      ml: 'ml',
      cx: 'cx',
      pct: 'pct',
      dz: 'dz',
    };
    return units[unit] || unit;
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border p-4 transition-all ${
        item.purchased
          ? 'border-green-200 dark:border-green-900/30 opacity-80'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Checkbox */}
          <button
            onClick={() => onToggleStatus(item.id, !item.purchased)}
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              item.purchased
                ? 'bg-green-500 border-green-500'
                : 'border-slate-300 dark:border-slate-600 hover:border-sky-500'
            }`}
          >
            {item.purchased && <i className="fas fa-check text-white text-xs"></i>}
          </button>

          {/* Nome e quantidade */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4
                className={`font-medium ${
                  item.purchased
                    ? 'line-through text-slate-500 dark:text-slate-500'
                    : 'text-slate-800 dark:text-white'
                }`}
              >
                {item.name}
              </h4>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({item.quantity} {getUnitLabel(item.unit)})
              </span>
            </div>
          </div>

          {/* Preço e ações */}
          <div className="flex items-center gap-4">
            <span
              className={`font-semibold ${
                item.purchased
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-800 dark:text-white'
              }`}
            >
              {formatCurrency(item.price * item.quantity)}
            </span>

            <div className="flex gap-1">
              <button
                onClick={() => onViewHistory(item.id)}
                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                title="Ver histórico"
              >
                <i className="fas fa-chart-line"></i>
              </button>
              <button
                onClick={() => onEdit(item)}
                className="p-1 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded"
                title="Editar"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Excluir"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Preço unitário:</span>
              <p className="font-medium">{formatCurrency(item.price)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Adicionado:</span>
              <p className="font-medium">
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListItem;
