// src/components/finance-metrics/shopping/ShoppingListCard.tsx
import React from 'react';
import { ShoppingList } from '../../../hooks/useShopping';
import ShoppingListItem from './ShoppingListItem';

interface ShoppingListCardProps {
  list: ShoppingList;
  onEditList: (list: ShoppingList) => void;
  onDeleteList: (listId: number) => void;
  onToggleItemStatus: (itemId: number, purchased: boolean) => void;
  onEditItem: (item: any) => void;
  onDeleteItem: (itemId: number) => void;
  onViewItemHistory: (itemId: number) => void;
  onAddItem: (listId: number) => void;
}

const ShoppingListCard: React.FC<ShoppingListCardProps> = ({
  list,
  onEditList,
  onDeleteList,
  onToggleItemStatus,
  onEditItem,
  onDeleteItem,
  onViewItemHistory,
  onAddItem,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const calculateTotal = () => {
    return list.items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculatePurchasedTotal = () => {
    return list.items
      .filter((item) => item.purchased)
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateProgress = () => {
    if (list.items.length === 0) return 0;
    const purchased = list.items.filter((item) => item.purchased).length;
    return Math.round((purchased / list.items.length) * 100);
  };

  const purchasedItems = list.items.filter((item) => item.purchased);
  const pendingItems = list.items.filter((item) => !item.purchased);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700">
      {/* Header da Lista */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{list.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Criada em{' '}
              {list.createdAt ? new Date(list.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAddItem(list.id)}
              className="px-3 py-1.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Adicionar Item
            </button>
            <button
              onClick={() => onEditList(list)}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => onDeleteList(list.id)}
              className="px-3 py-1.5 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        {/* Estatísticas da Lista */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total de Itens</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{list.items.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <p className="text-sm text-green-600 dark:text-green-400">Comprados</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {purchasedItems.length}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Pendentes</p>
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingItems.length}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-sm text-blue-600 dark:text-blue-400">Valor Total</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(calculateTotal())}
            </p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 dark:text-slate-400">Progresso</span>
            <span className="font-medium text-slate-800 dark:text-white">
              {calculateProgress()}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="p-6">
        {list.items.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-shopping-cart text-4xl text-slate-300 dark:text-slate-600 mb-3"></i>
            <p className="text-slate-600 dark:text-slate-400">
              Nenhum item na lista. Adicione seu primeiro item!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Itens Pendentes */}
            {pendingItems.length > 0 && (
              <>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pendentes ({pendingItems.length})
                </h4>
                {pendingItems.map((item) => (
                  <ShoppingListItem
                    key={item.id}
                    item={item}
                    onToggleStatus={onToggleItemStatus}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onViewHistory={onViewItemHistory}
                  />
                ))}
              </>
            )}

            {/* Itens Comprados */}
            {purchasedItems.length > 0 && (
              <>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-6">
                  Comprados ({purchasedItems.length})
                </h4>
                {purchasedItems.map((item) => (
                  <ShoppingListItem
                    key={item.id}
                    item={item}
                    onToggleStatus={onToggleItemStatus}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onViewHistory={onViewItemHistory}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingListCard;
