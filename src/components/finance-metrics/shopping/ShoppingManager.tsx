// src/components/finance-metrics/shopping/ShoppingManager.tsx
import React, { useState, useEffect } from 'react';
import { useShopping, ShoppingList } from '../../../hooks/useShopping';
import ShoppingListForm from './ShoppingListForm';
import ShoppingItemForm from './ShoppingItemForm';

import PriceHistoryModal from './PriceHistoryModal';
import ShoppingListCard from './ShoppingListCard.tsx';

const ShoppingManager: React.FC = () => {
  const {
    getAllLists,
    deleteList,
    deleteItem,
    updateItemStatus,
    data: lists,
    isLoading,
    error,
  } = useShopping();

  const [isListFormOpen, setIsListFormOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

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

  const handleEditItem = (item: any) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500 text-xl"></i>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              Erro ao carregar listas de compras
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }
  // No ShoppingManager.tsx, atualize essas funções:

  const handleDeleteList = async (listId: number) => {
    if (
      window.confirm('Tem certeza que deseja excluir esta lista? Todos os itens serão removidos.')
    ) {
      try {
        await deleteList(listId); // CHAMA API REAL
        await loadLists();
      } catch (error) {
        console.error('Erro ao deletar lista:', error);
        alert('Erro ao deletar lista. Tente novamente.');
      }
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteItem(itemId); // CHAMA API REAL
        await loadLists();
      } catch (error) {
        console.error('Erro ao deletar item:', error);
        alert('Erro ao deletar item. Tente novamente.');
      }
    }
  };

  const handleToggleItemStatus = async (itemId: number, purchased: boolean) => {
    try {
      await updateItemStatus(itemId, purchased); // CHAMA API REAL
      await loadLists();
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Listas de Compras</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Organize suas compras e acompanhe os preços
          </p>
        </div>
        <button
          onClick={handleCreateList}
          className="px-4 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Nova Lista
        </button>
      </div>

      {lists && lists.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-12 text-center">
          <i className="fas fa-shopping-basket text-5xl text-slate-300 dark:text-slate-600 mb-4"></i>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Nenhuma lista de compras encontrada
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Crie sua primeira lista para começar a organizar suas compras
          </p>
          <button
            onClick={handleCreateList}
            className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm flex items-center gap-2 mx-auto"
          >
            <i className="fas fa-plus"></i>
            Criar Primeira Lista
          </button>
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
    </div>
  );
};

export default ShoppingManager;
