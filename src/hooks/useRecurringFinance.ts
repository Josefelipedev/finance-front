// src/hooks/useRecurringFinance.ts
import { useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

export interface RecurringTransaction {
  id: number;
  description: string;
  amount: number;
  /** Moeda nativa da recorrência (ex.: "EUR", "BRL") */
  currency: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dueDay?: number;
  /** N-ésimo dia útil do mês; manda sobre o `dueDay`. */
  businessDay?: number | null;
  weekDay?: number;
  notification: boolean;
  categoryId: number;
  /**
   * Conta bancária de onde sai (ou onde entra) o dinheiro. As contas geradas
   * herdam-na, e é dela que sai a previsão "o que fica na conta no fim do mês".
   */
  accountId?: number | null;
  userId: number;
  /** Mês em que a recorrente começa a gerar contas. Nulo = mês de criação. */
  startDate?: string | null;
  /** Total contratado, quando é um parcelamento. */
  totalAmount?: number | null;
  /** Total já calculado pelo servidor (`totalAmount` ou parcela × parcelas). */
  contractedTotal?: number | null;
  /** Somatório do que foi mesmo pago (não é parcela × pagamentos). */
  paidTotal?: number | null;
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
  currency?: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dueDay?: number;
  businessDay?: number | null;
  weekDay?: number;
  notification?: boolean;
  categoryId: number;
  /** Conta bancária de origem/destino; `null` desliga. */
  accountId?: number | null;
  startDate?: string;
  endDate?: string;
  occurrences?: number;
  totalAmount?: number;
}

export interface UpdateRecurringTransactionDto {
  description?: string;
  amount?: number;
  currency?: string;
  type?: 'income' | 'expense';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dueDay?: number;
  businessDay?: number | null;
  weekDay?: number;
  notification?: boolean;
  categoryId?: number;
  accountId?: number | null;
  startDate?: string;
  endDate?: string;
  occurrences?: number;
  totalAmount?: number;
}

/** O que a quitação ("paguei tudo") pagou de facto. */
export interface SettleRecurringResult {
  recurring: RecurringTransaction;
  /** Valor liquidado, na moeda da recorrente. */
  settledAmount: number;
  currency: string;
  /** Lançamento único criado no razão. */
  financeId: number;
  billOccurrenceId: number;
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

  /**
   * "Paguei tudo": liquida de uma vez o que falta do parcelamento.
   *
   * O servidor marca as parcelas por pagar como liquidadas, cria UM lançamento
   * com o valor em falta (data de hoje) e fecha a recorrente. Devolve quanto é
   * que a quitação pagou, para o ecrã o poder dizer em vez de um "pronto".
   */
  const settleRecurringTransaction = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      return await api.post<SettleRecurringResult>(`/recurring-finance/${id}/settle`, {});
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

  /**
   * O que já foi pago desta recorrente (não confundir com o total contratado).
   *
   * Vem somado do servidor: `parcela × nº de pagamentos` só está certo enquanto
   * todas as parcelas valerem o mesmo, e deixa de estar quando a última absorve
   * o resto do arredondamento ou quando se paga um valor diferente do previsto.
   */
  const calculateTotalPaid = (transaction: RecurringTransaction): number =>
    transaction.paidTotal ?? transaction.amount * transaction.executedCount;

  // ===================== PUBLIC API =====================

  return {
    // Dados
    data,

    // CRUD
    createRecurringTransaction,
    getAllRecurringTransactions,
    getRecurringTransactionById,
    updateRecurringTransaction,
    settleRecurringTransaction,
    deleteRecurringTransaction,

    // Utilities
    calculateNextDueDate,
    isTransactionActive,
    calculateTotalPaid,

    // Estado
    isLoading,
    error,
    resetError: () => setError(null),
  };
}
