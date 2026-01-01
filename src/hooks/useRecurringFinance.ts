// src/hooks/useRecurringFinance.ts
import { useApi } from './useApi';

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

// Hook personalizado para transações recorrentes
export function useRecurringFinance() {
  const api = useApi<RecurringTransaction[]>('finance');

  const createRecurringTransaction = async (data: CreateRecurringTransactionDto) => {
    return await api.post('/recurring-finance', data);
  };

  const getAllRecurringTransactions = async () => {
    return await api.get('/recurring-finance');
  };

  const getRecurringTransactionById = async (id: number) => {
    const transactionApi = useApi<RecurringTransaction>('finance');
    return await transactionApi.get(`/recurring-finance/by-id/${id}`);
  };

  const updateRecurringTransaction = async (id: number, data: UpdateRecurringTransactionDto) => {
    const updateApi = useApi<RecurringTransaction>('finance');
    return await updateApi.put(`/recurring-finance/${id}`, data);
  };

  const deleteRecurringTransaction = async (id: number) => {
    const deleteApi = useApi<void>('finance');
    return await deleteApi.delete(`/recurring-finance/${id}`);
  };

  // Calcula o próximo vencimento
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

  // Verifica se a transação está ativa
  const isTransactionActive = (transaction: RecurringTransaction): boolean => {
    if (transaction.endDate) {
      const endDate = new Date(transaction.endDate);
      const today = new Date();
      if (endDate < today) return false;
    }

    if (transaction.occurrences && transaction.executedCount >= transaction.occurrences) {
      return false;
    }

    return true;
  };

  // Calcula o valor total até o momento
  const calculateTotalAmount = (transaction: RecurringTransaction): number => {
    return transaction.amount * transaction.executedCount;
  };

  return {
    // Métodos CRUD
    createRecurringTransaction,
    getAllRecurringTransactions,
    getRecurringTransactionById,
    updateRecurringTransaction,
    deleteRecurringTransaction,

    // Métodos utilitários
    calculateNextDueDate,
    isTransactionActive,
    calculateTotalAmount,

    // Estado
    data: api.data,
    error: api.error,
    isLoading: api.isLoading,
    isSuccess: api.isSuccess,
    isError: api.isError,
    reset: api.reset,
  };
}
