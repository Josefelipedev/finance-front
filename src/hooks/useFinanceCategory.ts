import { useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

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

// ===================== HOOK =====================

export function useFinanceCategory() {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===================== CREATE =====================

  const createCategory = async (data: CreateCategoryDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const category = await api.post<FinanceCategory>('/finance-category', data);

      if (category) {
        setCategories((prev) => [...prev, category]);
        return category;
      }

      throw new Error('Categoria inválida');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== READ =====================

  const getAllCategories = async (options?: GetAllCategoriesOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      let url = '/finance-category';
      if (options?.isActive !== undefined) {
        url += `?active=${options.isActive}`;
      }

      const data = await api.get<FinanceCategory[]>(url);

      if (Array.isArray(data)) {
        setCategories(data);
        return data;
      }

      throw new Error('Lista de categorias inválida');
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
      const category = await api.get<FinanceCategory>(`/finance-category/${id}`);

      if (category) {
        return category;
      }

      throw new Error('Categoria não encontrada');
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
      const summary = await api.get<CategorySummary>(`/finance-category/${categoryId}/summary`);

      if (summary) {
        return summary;
      }

      throw new Error('Resumo da categoria inválido');
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar resumo da categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== UPDATE =====================

  const updateCategory = async (id: number, data: UpdateCategoryDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await api.put<FinanceCategory>(`/finance-category/${id}`, data);

      if (updated) {
        setCategories((prev) => prev.map((cat) => (cat.id === id ? updated : cat)));
        return updated;
      }

      throw new Error('Falha ao atualizar categoria');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== DELETE =====================

  const deleteCategory = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<boolean>(`/finance-category/${id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== TOGGLE STATUS =====================

  const toggleCategoryStatus = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await api.post<FinanceCategory>(`/finance-category/${id}/toggle-status`);

      if (updated) {
        setCategories((prev) => prev.map((cat) => (cat.id === id ? updated : cat)));
        return updated;
      }

      throw new Error('Falha ao alternar status da categoria');
    } catch (err: any) {
      setError(err.message || 'Erro ao alternar status da categoria');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== PUBLIC API =====================

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
