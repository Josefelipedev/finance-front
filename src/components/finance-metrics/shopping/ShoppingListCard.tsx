import React from 'react';
import { ShoppingList, ShoppingItem } from '../../../hooks/useShopping';
import { formatMoney } from '../../../utils/currency';
import ShoppingListItem from './ShoppingListItem';
import { itemPrice } from '../../../utils/shopping-price';

interface ShoppingListCardProps {
  list: ShoppingList;
  /** Moeda do perfil — a mesma em que a despesa da compra é criada. */
  currency?: string | null;
  onEditList: (list: ShoppingList) => void;
  onDeleteList: (listId: number) => void;
  onToggleItemStatus: (itemId: number, purchased: boolean) => void;
  onEditItem: (item: ShoppingItem) => void;
  onDeleteItem: (itemId: number) => void;
  onViewItemHistory: (itemId: number) => void;
  onAddItem: (listId: number) => void;
  onEnrichPrices?: (listId: number) => void;
  isEnriching?: boolean;
  onShowStorePrices?: (itemName: string) => void;
  onClosePurchase?: (list: ShoppingList) => void;
  onReopenPurchase?: (list: ShoppingList) => void;
}

const ShoppingListCard: React.FC<ShoppingListCardProps> = ({
  list,
  currency,
  onEditList,
  onDeleteList,
  onToggleItemStatus,
  onEditItem,
  onDeleteItem,
  onViewItemHistory,
  onAddItem,
  onEnrichPrices,
  isEnriching = false,
  onShowStorePrices,
  onClosePurchase,
  onReopenPurchase,
}) => {
  // A moeda vem do perfil: estava fixa em EUR, o que mostrava contas em reais
  // com símbolo de euro — e agora este total tem de bater certo com o valor da
  // despesa que o fecho da compra cria.
  const formatCurrency = (amount: number) => formatMoney(amount, currency);

  const calculateTotal = () =>
    list.items.reduce((total, item) => total + itemPrice(item), 0);

  /** Fechada = já virou despesa; a lista passa a ser histórico. */
  const isClosed = !!list.closedAt;

  const hasScrapedPrices = list.items.some((i) => i.scrapedPrice != null && i.scrapedPrice > 0);

  const calculateProgress = () => {
    if (list.items.length === 0) return 0;
    const purchased = list.items.filter((item) => item.purchased).length;
    return Math.round((purchased / list.items.length) * 100);
  };

  const purchasedItems = list.items.filter((item) => item.purchased);
  const pendingItems = list.items.filter((item) => !item.purchased);
  // Mesma regra do servidor: é este o valor que vira despesa ao fechar.
  const purchasedTotal = purchasedItems.reduce(
    (total, item) => total + itemPrice(item),
    0
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
              {list.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Criada em{' '}
              {list.createdAt ? new Date(list.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isClosed ? (
              onReopenPurchase && (
                <button
                  onClick={() => onReopenPurchase(list)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                  title="Reabrir a compra e apagar a despesa criada"
                >
                  <i className="fas fa-rotate-left" />
                  Reabrir compra
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => onAddItem(list.id)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus" />
                  Adicionar Item
                </button>

                {onEnrichPrices && (
                  <button
                    onClick={() => onEnrichPrices(list.id)}
                    disabled={isEnriching}
                    className="w-full sm:w-auto px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    title="Buscar melhores preços nos supermercados"
                  >
                    {isEnriching ? (
                      <>
                        <i className="fas fa-spinner fa-spin" /> A actualizar...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-tags" /> Actualizar preços
                      </>
                    )}
                  </button>
                )}

                {onClosePurchase && purchasedItems.length > 0 && (
                  <button
                    onClick={() => onClosePurchase(list)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-brand-400 text-gray-950 rounded-lg hover:bg-brand-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    title="Lançar os itens comprados como despesa"
                  >
                    <i className="fas fa-receipt" />
                    Fechar compra
                  </button>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => onEditList(list)}
                    className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    title="Editar lista"
                  >
                    <i className="fas fa-edit" />
                  </button>
                  <button
                    onClick={() => onDeleteList(list.id)}
                    className="p-2.5 border border-red-300 dark:border-red-700 rounded-lg text-error-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Excluir lista"
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {isClosed && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-success-500/30 bg-success-50 dark:bg-success-500/10 px-4 py-3">
            <i className="fas fa-circle-check text-success-600 dark:text-success-400" />
            <span className="text-sm text-success-700 dark:text-success-400">
              Compra fechada em {new Date(list.closedAt as string).toLocaleDateString('pt-BR')} —{' '}
              {formatCurrency(purchasedTotal)} lançados como despesa.
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatCard label="Total de Itens" value={list.items.length} />
          <StatCard label="Comprados" value={purchasedItems.length} color="green" />
          <StatCard label="Pendentes" value={pendingItems.length} color="yellow" />
          <StatCard
            label={hasScrapedPrices ? '💶 Total (scraper)' : 'Valor Total'}
            value={formatCurrency(calculateTotal())}
            color="blue"
          />
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progresso</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {calculateProgress()}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
            <i className="fas fa-shopping-cart text-4xl text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    currency={currency}
                    readOnly={isClosed}
                    onToggleStatus={onToggleItemStatus}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onViewHistory={onViewItemHistory}
                    onShowStorePrices={onShowStorePrices}
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
                    currency={currency}
                    readOnly={isClosed}
                    onToggleStatus={onToggleItemStatus}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onViewHistory={onViewItemHistory}
                    onShowStorePrices={onShowStorePrices}
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
  const colors: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    blue: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
  };

  return (
    <div className={`rounded-lg p-3 ${colors[color || ''] || 'bg-gray-50 dark:bg-gray-900/50'}`}>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
    <div className="space-y-2">{children}</div>
  </div>
);

export default ShoppingListCard;
