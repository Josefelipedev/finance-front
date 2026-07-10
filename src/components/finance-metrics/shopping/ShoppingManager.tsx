import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useShopping, ShoppingList, ShoppingItem, AiGenerateResult } from '../../../hooks/useShopping';
import ShoppingListForm from './ShoppingListForm';
import ShoppingItemForm from './ShoppingItemForm';
import PriceHistoryModal from './PriceHistoryModal';
import ShoppingListCard from './ShoppingListCard.tsx';
import AIShoppingModal from './AIShoppingModal';
import AIResultModal from './AIResultModal';
import StorePricesModal from './StorePricesModal';
import { useConfirm } from '../../ui/confirm/useConfirm';

const ShoppingManager: React.FC = () => {
  const {
    getAllLists,
    deleteList,
    deleteItem,
    updateItemStatus,
    enrichPrices,
    getPricesByStore,
    data: lists,
    isLoading,
    error,
  } = useShopping();
  const { confirm, dialog } = useConfirm();

  const [isListFormOpen, setIsListFormOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiResult, setAiResult] = useState<AiGenerateResult | null>(null);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [enrichingListId, setEnrichingListId] = useState<number | null>(null);
  const [storePricesItem, setStorePricesItem] = useState<string | null>(null);
  const [storePrices, setStorePrices] = useState<{ supermarket: string; name: string; price: number; brand?: string }[]>([]);
  const [loadingStorePrices, setLoadingStorePrices] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    await getAllLists();
  };

  const handleCreateList = () => {
    setEditingList(null);
    setIsListFormOpen(true);
  };

  const handleEditList = (list: ShoppingList) => {
    setEditingList(list);
    setIsListFormOpen(true);
  };

  const handleAddItem = (listId: number) => {
    setSelectedListId(listId);
    setEditingItem(null);
    setIsItemFormOpen(true);
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setIsItemFormOpen(true);
  };

  const handleViewItemHistory = (itemId: number) => {
    setSelectedItemId(itemId);
    setIsHistoryModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsListFormOpen(false);
    setIsItemFormOpen(false);
    setEditingList(null);
    setEditingItem(null);
    setSelectedListId(null);
    loadLists();
  };

  const handleAISuccess = (result: AiGenerateResult) => {
    setIsAIModalOpen(false);
    setAiResult(result);
    loadLists();
  };

  const handleEnrichPrices = async (listId: number) => {
    setEnrichingListId(listId);
    try {
      const result = await enrichPrices(listId);
      if (result) {
        toast.success(`Preços actualizados: ${result.enriched} itens${result.failed.length ? ` (${result.failed.length} sem resultado)` : ''}`);
      }
    } catch {
      toast.error('Erro ao actualizar preços. Verifique se o serviço está disponível.');
    } finally {
      setEnrichingListId(null);
    }
  };

  const handleShowStorePrices = async (itemName: string) => {
    setStorePricesItem(itemName);
    setStorePrices([]);
    setLoadingStorePrices(true);
    try {
      const prices = await getPricesByStore(itemName);
      setStorePrices(prices ?? []);
    } finally {
      setLoadingStorePrices(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-error-500 text-xl"></i>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              Erro ao carregar listas de compras
            </h3>
            <p className="text-error-600 dark:text-red-400 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }
  const handleDeleteList = async (listId: number) => {
    if (
      await confirm({
        title: 'Excluir lista',
        message: 'Tem certeza que deseja excluir esta lista? Todos os itens serão removidos.',
        confirmText: 'Excluir',
        danger: true,
      })
    ) {
      try {
        await deleteList(listId);
        toast.success('Lista excluída com sucesso');
        await loadLists();
      } catch (err) {
        toast.error((err as Error).message || 'Erro ao deletar lista. Tente novamente.');
      }
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (
      await confirm({
        title: 'Excluir item',
        message: 'Tem certeza que deseja excluir este item?',
        confirmText: 'Excluir',
        danger: true,
      })
    ) {
      try {
        await deleteItem(itemId);
        toast.success('Item excluído com sucesso');
        await loadLists();
      } catch (err) {
        toast.error((err as Error).message || 'Erro ao deletar item. Tente novamente.');
      }
    }
  };

  const handleToggleItemStatus = async (itemId: number, purchased: boolean) => {
    try {
      await updateItemStatus(itemId, purchased);
      await loadLists();
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao atualizar status. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Listas de Compras</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize suas compras e acompanhe os preços
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-brand-500 text-white rounded-lg hover:from-purple-600 hover:to-brand-600 transition-all shadow-sm flex items-center gap-2"
          >
            <i className="fas fa-robot"></i>
            Gerar com IA
          </button>
          <button
            onClick={handleCreateList}
            className="px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nova Lista
          </button>
        </div>
      </div>

      {lists && lists.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
          <i className="fas fa-shopping-basket text-5xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Nenhuma lista de compras encontrada
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Crie sua primeira lista manualmente ou deixe a IA montar uma lista econômica para você
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-brand-500 text-white rounded-lg hover:from-purple-600 hover:to-brand-600 transition-all shadow-sm flex items-center gap-2 justify-center"
            >
              <i className="fas fa-robot"></i>
              Gerar com IA
            </button>
            <button
              onClick={handleCreateList}
              className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2 justify-center"
            >
              <i className="fas fa-plus"></i>
              Criar Manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {lists?.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onEditList={handleEditList}
              onDeleteList={handleDeleteList}
              onToggleItemStatus={handleToggleItemStatus}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onViewItemHistory={handleViewItemHistory}
              onAddItem={handleAddItem}
              onEnrichPrices={handleEnrichPrices}
              isEnriching={enrichingListId === list.id}
              onShowStorePrices={handleShowStorePrices}
            />
          ))}
        </div>
      )}

      {isListFormOpen && (
        <ShoppingListForm
          list={editingList}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsListFormOpen(false);
            setEditingList(null);
          }}
        />
      )}

      {isItemFormOpen && (
        <ShoppingItemForm
          listId={selectedListId || 0}
          item={editingItem}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsItemFormOpen(false);
            setEditingItem(null);
            setSelectedListId(null);
          }}
        />
      )}

      {isHistoryModalOpen && selectedItemId && (
        <PriceHistoryModal
          itemId={selectedItemId}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedItemId(null);
          }}
        />
      )}

      {isAIModalOpen && (
        <AIShoppingModal
          onSuccess={handleAISuccess}
          onCancel={() => setIsAIModalOpen(false)}
        />
      )}

      {aiResult && (
        <AIResultModal
          result={aiResult}
          onClose={() => setAiResult(null)}
        />
      )}

      {storePricesItem && (
        <StorePricesModal
          itemName={storePricesItem}
          prices={storePrices}
          isLoading={loadingStorePrices}
          onClose={() => { setStorePricesItem(null); setStorePrices([]); }}
        />
      )}
      {dialog}
    </div>
  );
};

export default ShoppingManager;
