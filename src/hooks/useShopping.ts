
// src/hooks/useShopping.ts
import { useApi } from './useApi';

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

export interface AddItemDto {
    listId: number;
    name: string;
    quantity: number;
    unit: string;
    price: number;
}

export interface UpdateItemStatusDto {
    itemId: number;
    purchased: boolean;
}

export interface CreateOrUpdateItemDto {
    itemId?: number;
    name: string;
    quantity: number;
    unit: string;
    price: number;
    shoppingListId: number;
}

// Hook personalizado para listas de compras
export function useShopping() {
    const api = useApi<ShoppingList[]>('finance');

    const createList = async (data: CreateListDto) => {
        return await api.post('/shopping/list', data);
    };

    const addItem = async (data: AddItemDto) => {
        return await api.post('/shopping/item', data);
    };

    const getAllLists = async () => {
        return await api.get('/shopping');
    };

    const updateItemStatus = async (itemId: number, purchased: boolean) => {
        return await api.patch(`/shopping/item/${itemId}`, { purchased });
    };

    const createOrUpdateItem = async (data: CreateOrUpdateItemDto) => {
        return await api.post('/shopping/shopping-item', data);
    };

    const getPriceHistory = async (itemId: number) => {
        const historyApi = useApi<PriceHistory[]>('finance');
        return await historyApi.get(`/shopping/shopping-item/${itemId}/history`);
    };

    // Calcula o total da lista de compras
    const calculateListTotal = (list: ShoppingList): number => {
        return list.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    };

    // Calcula o total de itens comprados
    const calculatePurchasedTotal = (list: ShoppingList): number => {
        return list.items
            .filter(item => item.purchased)
            .reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
    };

    // Calcula o progresso da lista
    const calculateListProgress = (list: ShoppingList): number => {
        const totalItems = list.items.length;
        if (totalItems === 0) return 0;
        const purchasedItems = list.items.filter(item => item.purchased).length;
        return (purchasedItems / totalItems) * 100;
    };

    // Filtra itens por status
    const filterItemsByStatus = (list: ShoppingList, purchased: boolean) => {
        return list.items.filter(item => item.purchased === purchased);
    };

    // Encontra o menor preço no histórico
    const findLowestPrice = (priceHistory: PriceHistory[]): number => {
        if (priceHistory.length === 0) return 0;
        return Math.min(...priceHistory.map(history => history.price));
    };

    // Encontra o maior preço no histórico
    const findHighestPrice = (priceHistory: PriceHistory[]): number => {
        if (priceHistory.length === 0) return 0;
        return Math.max(...priceHistory.map(history => history.price));
    };

    // Calcula a média de preços
    const calculateAveragePrice = (priceHistory: PriceHistory[]): number => {
        if (priceHistory.length === 0) return 0;
        const sum = priceHistory.reduce((total, history) => total + history.price, 0);
        return sum / priceHistory.length;
    };

    return {
        // Métodos CRUD
        createList,
        addItem,
        getAllLists,
        updateItemStatus,
        createOrUpdateItem,
        getPriceHistory,

        // Métodos utilitários
        calculateListTotal,
        calculatePurchasedTotal,
        calculateListProgress,
        filterItemsByStatus,
        findLowestPrice,
        findHighestPrice,
        calculateAveragePrice,

        // Estado
        data: api.data,
        error: api.error,
        isLoading: api.isLoading,
        isSuccess: api.isSuccess,
        isError: api.isError,
        reset: api.reset,
    };
}