import React from 'react';
import { ShoppingItem } from '../../../hooks/useShopping';

interface ShoppingListItemProps {
  item: ShoppingItem;
  onToggleStatus: (itemId: number, purchased: boolean) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (itemId: number) => void;
  onViewHistory: (itemId: number) => void;
  onShowStorePrices?: (itemName: string) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({
  item,
  onToggleStatus,
  onEdit,
  onDelete,
  onViewHistory,
  onShowStorePrices,
}) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
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
            ? 'bg-white/80 dark:bg-gray-800/80 border-green-200 dark:border-green-900/30'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
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
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand-500'
              }
            `}
          >
            {item.purchased && <i className="fas fa-check text-white text-xs" />}
          </button>

          {/* Texto */}
          <div className="min-w-0">
            <p
              className={`text-sm font-medium truncate
                ${item.purchased ? 'line-through text-gray-500' : 'text-gray-800 dark:text-white'}
              `}
            >
              {item.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {item.quantity} {getUnitLabel(item.unit)} ·{' '}
              {formatCurrency(item.price)}
            </p>
            {item.scrapedPrice != null && item.scrapedPrice > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                  {item.supermarket === 'continente' ? '🏪' :
                   item.supermarket === 'auchan' ? '🟠' :
                   item.supermarket === 'pingodoce' ? '🟡' :
                   item.supermarket === 'mercadona' ? '🟢' : '🏷️'}
                  {' '}{item.supermarket && item.supermarket.charAt(0).toUpperCase() + item.supermarket.slice(1)}{' '}
                  {formatCurrency(item.scrapedPrice)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* DIREITA — AÇÕES */}
        <div className="flex items-center gap-2 shrink-0">
          {onShowStorePrices && (
            <button
              onClick={() => onShowStorePrices(item.name)}
              className="p-1.5 rounded text-green-500 hover:bg-green-500/10"
              title="Comparar preços nos supermercados"
            >
              <i className="fas fa-tags" />
            </button>
          )}

          <button
            onClick={() => onViewHistory(item.id)}
            className="p-1.5 rounded text-brand-500 hover:bg-brand-500/10"
            title="Ver histórico"
          >
            <i className="fas fa-chart-line" />
          </button>

          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded text-brand-500 hover:bg-brand-500/10"
            title="Editar"
          >
            <i className="fas fa-edit" />
          </button>

          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded text-error-500 hover:bg-error-500/10"
            title="Excluir"
          >
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ShoppingListItem;
