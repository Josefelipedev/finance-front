import { useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

export interface ShoppingList {
  id: number;
  name: string;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
  items: ShoppingItem[];
}

export interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  purchased: boolean;
  shoppingListId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PriceHistory {
  id: number;
  shoppingItemId: number;
  price: number;
  createdAt: string;
}

export interface CreateListDto {
  name: string;
}

export interface UpdateListDto {
  name?: string;
}

export interface AddItemDto {
  listId: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface UpdateItemDto {
  name?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  purchased?: boolean;
}

export interface CreateOrUpdateItemDto {
  itemId?: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  shoppingListId: number;
}

// ===================== HOOK =====================

export function useShopping() {
  const [data, setData] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ===================== LISTS =====================

  const createList = async (payload: CreateListDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const list = await api.post<ShoppingList>('/shopping/list', payload);

      if (!list) {
        throw new Error('Lista inválida');
      }

      setData((prev) => [...prev, list]);
      return list;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateList = async (listId: number, payload: UpdateListDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const list = await api.put<ShoppingList>(`/shopping/list/${listId}`, payload);

      if (!list) {
        throw new Error('Falha ao atualizar lista');
      }

      setData((prev) => prev.map((l) => (l.id === list.id ? list : l)));
      return list;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteList = async (listId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<boolean>(`/shopping/list/${listId}`);
      setData((prev) => prev.filter((l) => l.id !== listId));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllLists = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const lists = await api.get<ShoppingList[]>('/shopping');

      if (!Array.isArray(lists)) {
        throw new Error('Resposta inválida de listas');
      }

      setData(lists);
      return lists;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getListById = async (listId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const list = await api.get<ShoppingList>(`/shopping/list/${listId}`);

      if (!list) {
        throw new Error('Lista não encontrada');
      }

      return list;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== ITEMS =====================

  const addItem = async (payload: AddItemDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const item = await api.post<ShoppingItem>('/shopping/item', payload);

      if (!item) {
        throw new Error('Item inválido');
      }

      setData((prev) =>
        prev.map((list) =>
          list.id === item.shoppingListId ? { ...list, items: [...list.items, item] } : list
        )
      );

      return item;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (itemId: number, payload: UpdateItemDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const item = await api.put<ShoppingItem>(`/shopping/item/${itemId}`, payload);

      if (!item) {
        throw new Error('Falha ao atualizar item');
      }

      setData((prev) =>
        prev.map((list) => ({
          ...list,
          items: list.items.map((i) => (i.id === item.id ? item : i)),
        }))
      );

      return item;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (itemId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<boolean>(`/shopping/item/${itemId}`);

      setData((prev) =>
        prev.map((list) => ({
          ...list,
          items: list.items.filter((i) => i.id !== itemId),
        }))
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemStatus = async (itemId: number, purchased: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const item = await api.put<ShoppingItem>(`/shopping/item/${itemId}`, { purchased });

      if (!item) {
        throw new Error('Falha ao atualizar status');
      }

      setData((prev) =>
        prev.map((list) => ({
          ...list,
          items: list.items.map((i) => (i.id === item.id ? item : i)),
        }))
      );

      return item;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createOrUpdateItem = async (payload: CreateOrUpdateItemDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const item = await api.post<ShoppingItem>('/shopping/shopping-item', payload);

      if (!item) {
        throw new Error('Item inválido');
      }

      return item;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceHistory = async (itemId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const history = await api.get<PriceHistory[]>(`/shopping/shopping-item/${itemId}/history`);

      if (!Array.isArray(history)) {
        throw new Error('Histórico inválido');
      }

      return history;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== UTILITIES =====================

  const calculateListTotal = (list: ShoppingList): number =>
    list.items.reduce((total, item) => total + item.price * item.quantity, 0);

  const calculatePurchasedTotal = (list: ShoppingList): number =>
    list.items.filter((i) => i.purchased).reduce((t, i) => t + i.price * i.quantity, 0);

  const calculatePendingTotal = (list: ShoppingList): number =>
    list.items.filter((i) => !i.purchased).reduce((t, i) => t + i.price * i.quantity, 0);

  const calculateListProgress = (list: ShoppingList): number =>
    list.items.length === 0
      ? 0
      : (list.items.filter((i) => i.purchased).length / list.items.length) * 100;

  const calculateSavings = (current: number, avg: number): number =>
    avg === 0 ? 0 : Math.round(((avg - current) / avg) * 10000) / 100;

  const filterItemsByStatus = (list: ShoppingList, purchased: boolean) =>
    list.items.filter((i) => i.purchased === purchased);

  const findLowestPrice = (history: PriceHistory[]) =>
    history.length ? Math.min(...history.map((h) => h.price)) : 0;

  const findHighestPrice = (history: PriceHistory[]) =>
    history.length ? Math.max(...history.map((h) => h.price)) : 0;

  const calculateAveragePrice = (history: PriceHistory[]) =>
    history.length ? history.reduce((s, h) => s + h.price, 0) / history.length : 0;

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);

  // ===================== PUBLIC API =====================

  return {
    // Dados
    data,

    // CRUD Listas
    createList,
    updateList,
    deleteList,
    getAllLists,
    getListById,

    // CRUD Itens
    addItem,
    updateItem,
    deleteItem,
    updateItemStatus,
    createOrUpdateItem,
    getPriceHistory,

    // Utilidades
    calculateListTotal,
    calculatePurchasedTotal,
    calculatePendingTotal,
    calculateListProgress,
    calculateSavings,
    filterItemsByStatus,
    findLowestPrice,
    findHighestPrice,
    calculateAveragePrice,
    formatCurrency,

    // Estado
    isLoading,
    error,
    resetError: () => setError(null),
  };
}
