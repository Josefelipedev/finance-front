import { useState } from 'react';
import { useApi } from './useApi';

export interface FinanceCategory {
  id: number;
  name: string;
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
  transactionCount: number;
}

export interface CreateCategoryDto {
  name: string;
  iconName?: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  iconName?: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

interface GetAllCategoriesOptions {
  isActive?: boolean;
}

export function useFinanceCategory() {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi<FinanceCategory[]>('finance');

  const createCategory = async (data: CreateCategoryDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.post('/finance-category', data);
      setCategories((prev) => [...prev, result]);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllCategories = async (options?: GetAllCategoriesOptions) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/finance-category';
      if (options?.isActive !== undefined) {
        url += `?active=${options.isActive}`;
      }
      const data = await api.get(url);
      setCategories(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar categorias');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryById = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.get(`/finance-category/${id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCategorySummary = async (categoryId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.get(`/finance-category/${categoryId}/summary`);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar resumo da categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: number, data: UpdateCategoryDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.put(`/finance-category/${id}`, data);
      setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...result } : cat)));
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.del(`/finance-category/${id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategoryStatus = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.post(`/finance-category/${id}/toggle-status`);
      setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...result } : cat)));
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao alternar status da categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Dados
    categories,

    // Métodos
    createCategory,
    getAllCategories,
    getCategoryById,
    getCategorySummary,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,

    // Estado
    isLoading,
    error,
    setError,
  };
}
