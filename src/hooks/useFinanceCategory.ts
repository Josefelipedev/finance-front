// src/hooks/useFinanceCategory.ts
import { useApi } from './useApi';

export interface FinanceCategory {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  color?: string;
  iconName?: string;
  description?: string;
  isActive: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
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

export interface UpdateCategoryDto {
  name?: string;
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

  const updateCategory = async (id: number, data: UpdateCategoryDto) => {
    const updateApi = useApi<FinanceCategory>('finance');
    return await updateApi.put(`/finance-category/${id}`, data);
  };

  const deleteCategory = async (id: number) => {
    const deleteApi = useApi<void>('finance');
    return await deleteApi.delete(`/finance-category/${id}`);
  };

  return {
    // Métodos
    createCategory,
    getAllCategories,
    getCategoryById,
    getCategorySummary,
    updateCategory,
    deleteCategory,
    // Estado
    data: api.data,
    error: api.error,
    isLoading: api.isLoading,
    isSuccess: api.isSuccess,
    isError: api.isError,
    reset: api.reset,
  };
}
