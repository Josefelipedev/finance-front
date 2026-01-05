// src/hooks/useRecurringFinance.ts
import { useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

export interface RecurringTransaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dueDay?: number;
  weekDay?: number;
  notification: boolean;
  categoryId: number;
  userId: number;
  endDate?: string;
  occurrences?: number;
  executedCount: number;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id: number;
    name: string;
    iconName?: string;
  };
}

export interface CreateRecurringTransactionDto {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dueDay?: number;
  weekDay?: number;
  notification?: boolean;
  categoria: string;
  endDate?: string;
  occurrences?: number;
}

export interface UpdateRecurringTransactionDto {
  description?: string;
  amount?: number;
  type?: 'income' | 'expense';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dueDay?: number;
  weekDay?: number;
  notification?: boolean;
  categoria?: string;
  endDate?: string;
  occurrences?: number;
}

// ===================== HOOK =====================

export function useRecurringFinance() {
  const [data, setData] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ===================== CRUD =====================

  const createRecurringTransaction = async (payload: CreateRecurringTransactionDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const transaction = await api.post<RecurringTransaction>('/recurring-finance', payload);

      if (!transaction) {
        throw new Error('Transação recorrente inválida');
      }

      setData((prev) => [...prev, transaction]);
      return transaction;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllRecurringTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const transactions = await api.get<RecurringTransaction[]>('/recurring-finance');

      if (!Array.isArray(transactions)) {
        throw new Error('Lista de transações inválida');
      }

      setData(transactions);
      return transactions;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getRecurringTransactionById = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const transaction = await api.get<RecurringTransaction>(`/recurring-finance/by-id/${id}`);

      if (!transaction) {
        throw new Error('Transação recorrente não encontrada');
      }

      return transaction;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecurringTransaction = async (id: number, payload: UpdateRecurringTransactionDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await api.put<RecurringTransaction>(`/recurring-finance/${id}`, payload);

      if (!updated) {
        throw new Error('Falha ao atualizar transação recorrente');
      }

      setData((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecurringTransaction = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<boolean>(`/recurring-finance/${id}`);

      setData((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== UTILITIES =====================

  const calculateNextDueDate = (transaction: RecurringTransaction): Date => {
    const now = new Date();
    const nextDate = new Date(now);

    switch (transaction.frequency) {
      case 'daily':
        nextDate.setDate(now.getDate() + 1);
        break;

      case 'weekly':
        if (transaction.weekDay !== undefined) {
          const daysUntilNext = (transaction.weekDay - now.getDay() + 7) % 7 || 7;
          nextDate.setDate(now.getDate() + daysUntilNext);
        } else {
          nextDate.setDate(now.getDate() + 7);
        }
        break;

      case 'monthly':
        if (transaction.dueDay !== undefined) {
          nextDate.setMonth(now.getMonth() + 1);
          nextDate.setDate(
            Math.min(
              transaction.dueDay,
              new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
            )
          );
        } else {
          nextDate.setMonth(now.getMonth() + 1);
        }
        break;

      case 'yearly':
        nextDate.setFullYear(now.getFullYear() + 1);
        break;
    }

    return nextDate;
  };

  const isTransactionActive = (transaction: RecurringTransaction): boolean => {
    if (transaction.endDate) {
      const endDate = new Date(transaction.endDate);
      if (endDate < new Date()) return false;
    }

    if (transaction.occurrences && transaction.executedCount >= transaction.occurrences) {
      return false;
    }

    return true;
  };

  const calculateTotalAmount = (transaction: RecurringTransaction): number => {
    return transaction.amount * transaction.executedCount;
  };

  // ===================== PUBLIC API =====================

  return {
    // Dados
    data,

    // CRUD
    createRecurringTransaction,
    getAllRecurringTransactions,
    getRecurringTransactionById,
    updateRecurringTransaction,
    deleteRecurringTransaction,

    // Utilities
    calculateNextDueDate,
    isTransactionActive,
    calculateTotalAmount,

    // Estado
    isLoading,
    error,
    resetError: () => setError(null),
  };
}
