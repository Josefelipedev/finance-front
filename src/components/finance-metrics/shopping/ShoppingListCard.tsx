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
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);

  const calculateTotal = () =>
    list.items.reduce((total, item) => total + item.price * item.quantity, 0);

  const calculateProgress = () => {
    if (list.items.length === 0) return 0;
    const purchased = list.items.filter((item) => item.purchased).length;
    return Math.round((purchased / list.items.length) * 100);
  };

  const purchasedItems = list.items.filter((item) => item.purchased);
  const pendingItems = list.items.filter((item) => !item.purchased);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
              {list.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Criada em{' '}
              {list.createdAt ? new Date(list.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => onAddItem(list.id)}
              className="w-full sm:w-auto px-4 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus" />
              Adicionar Item
            </button>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => onEditList(list)}
                className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                title="Editar lista"
              >
                <i className="fas fa-edit" />
              </button>
              <button
                onClick={() => onDeleteList(list.id)}
                className="p-2.5 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Excluir lista"
              >
                <i className="fas fa-trash" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatCard label="Total de Itens" value={list.items.length} />
          <StatCard label="Comprados" value={purchasedItems.length} color="green" />
          <StatCard label="Pendentes" value={pendingItems.length} color="yellow" />
          <StatCard label="Valor Total" value={formatCurrency(calculateTotal())} color="blue" />
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 dark:text-slate-400">Progresso</span>
            <span className="font-medium text-slate-800 dark:text-white">
              {calculateProgress()}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-4 sm:p-6">
        {list.items.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-shopping-cart text-4xl text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Nenhum item na lista. Adicione seu primeiro item.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingItems.length > 0 && (
              <Section title={`Pendentes (${pendingItems.length})`}>
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
              </Section>
            )}

            {purchasedItems.length > 0 && (
              <Section title={`Comprados (${purchasedItems.length})`}>
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
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: React.ReactNode;
  color?: 'green' | 'yellow' | 'blue';
}) => {
  const colors: any = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={`rounded-lg p-3 ${colors[color || ''] || 'bg-slate-50 dark:bg-slate-900/50'}`}>
      <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">{title}</h4>
    <div className="space-y-2">{children}</div>
  </div>
);

export default ShoppingListCard;
