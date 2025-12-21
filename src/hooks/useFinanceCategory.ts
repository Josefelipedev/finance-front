// src/hooks/useFinanceCategory.ts
import { useApi } from './useApi';

export interface FinanceCategory {
    id: number;
    name: string;
    iconName?: string;
    userId: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CategorySummary {
    totalReceita: number;
    totalDespesa: number;
    saldo: number;
}

export interface CreateCategoryDto {
    name: string;
    iconName?: string;
}

// Hook personalizado para categorias
export function useFinanceCategory() {
    const api = useApi<FinanceCategory[]>('finance');

    const createCategory = async (data: CreateCategoryDto) => {
        return await api.post('/finance-category', data);
    };

    const getAllCategories = async () => {
        return await api.get('/finance-category');
    };

    const getCategoryById = async (id: number) => {
        const categoryApi = useApi<FinanceCategory>('finance');
        return await categoryApi.get(`/finance-category/by-id/${id}`);
    };

    const getCategorySummary = async (categoryId: number) => {
        const summaryApi = useApi<CategorySummary>('finance');
        return await summaryApi.get(`/finance-category/${categoryId}/summary`);
    };

    return {
        // Métodos
        createCategory,
        getAllCategories,
        getCategoryById,
        getCategorySummary,

        // Estado
        data: api.data,
        error: api.error,
        isLoading: api.isLoading,
        isSuccess: api.isSuccess,
        isError: api.isError,
        reset: api.reset,
    };
}