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
  const [isExpanded] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);

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
      className={`rounded-lg border p-3 overflow-hidden transition-all
        ${
          item.purchased
            ? 'bg-white/80 dark:bg-slate-800/80 border-green-200 dark:border-green-900/30'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }
      `}
    >
      <div className="flex items-center justify-between gap-3">
        {/* ESQUERDA */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Checkbox */}
          <button
            onClick={() => onToggleStatus(item.id, !item.purchased)}
            className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center
              ${
                item.purchased
                  ? 'bg-green-500 border-green-500'
                  : 'border-slate-300 dark:border-slate-600 hover:border-sky-500'
              }
            `}
          >
            {item.purchased && <i className="fas fa-check text-white text-xs" />}
          </button>

          {/* Texto */}
          <div className="min-w-0">
            <p
              className={`text-sm font-medium truncate
                ${item.purchased ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'}
              `}
            >
              {item.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {item.quantity} {getUnitLabel(item.unit)} ·{' '}
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        </div>

        {/* DIREITA — AÇÕES */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onViewHistory(item.id)}
            className="p-1.5 rounded text-blue-500 hover:bg-blue-500/10"
            title="Ver histórico"
          >
            <i className="fas fa-chart-line" />
          </button>

          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded text-sky-500 hover:bg-sky-500/10"
            title="Editar"
          >
            <i className="fas fa-edit" />
          </button>

          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded text-red-500 hover:bg-red-500/10"
            title="Excluir"
          >
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>

      {/* Detalhes (se quiser usar depois) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
          <p>
            Preço unitário: <strong>{formatCurrency(item.price)}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default ShoppingListItem;
