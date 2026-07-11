import { useCallback, useState } from 'react';
import api from '../services/api';

// ===== Tipos da resposta de GET /bills =====
export type BillType = 'expense' | 'income';

export interface BillItem {
  id: number;
  type: BillType; // 'expense' (a pagar) | 'income' (a receber)
  description: string;
  amount: number; // valor previsto, na moeda nativa
  paidAmount: number | null; // valor efetivamente pago/recebido, na moeda nativa (null quando pendente)
  currency: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  dueDate: string; // ISO date
  status: 'pending' | 'paid';
  paidAt: string | null;
  overdue: boolean; // pendente e já venceu
  carriedOver: boolean; // veio de um mês anterior (atrasada)
}

/** Subtotais (JÁ convertidos para displayCurrency pelo servidor) por lado. */
export interface BillSideTotals {
  pending: number;
  paid: number;
}

/** Corpo de criação de conta avulsa (POST /bills). */
export interface CreateBillDto {
  description: string;
  amount: number;
  dueDate: string; // "YYYY-MM-DD"
  type: BillType;
  currency?: string;
  categoryId?: number;
}

/** Corpo de edição de uma ocorrência pendente (PATCH /bills/:id). */
export interface UpdateBillDto {
  description?: string;
  amount?: number;
  dueDate?: string; // "YYYY-MM-DD"
  categoryId?: number;
}

/** Subtotal pendente por moeda nativa. */
export interface BillCurrencySubtotal {
  currency: string;
  amount: number;
}

export interface BillsResponse {
  month: string; // "YYYY-MM"
  items: BillItem[];
  totalPending: number; // = expense.pending (compat) — JÁ convertido para displayCurrency
  totalPaid: number; // = expense.paid (compat) — JÁ convertido para displayCurrency
  expense: BillSideTotals; // a pagar (convertido)
  income: BillSideTotals; // a receber (convertido)
  projectedBalance: number; // previsto: income(todo) - expense(todo), convertido
  realizedBalance: number; // realizado: income.paid - expense.paid, convertido
  displayCurrency: string; // moeda de exibição do usuário, ex. "EUR" | "BRL"
  rateDate: string | null; // data da taxa de câmbio usada
  byCurrency: BillCurrencySubtotal[]; // subtotais pendentes por moeda nativa
  unconvertedCurrencies: string[]; // moedas sem cobertura de taxa
}

/**
 * Contas a pagar (GET /bills?month=YYYY-MM) com marcar como pago/pendente.
 * Segue a convenção do app: import default de `api`, métodos com useCallback,
 * `isLoading`/`error`. Todos os métodos retornam o resultado.
 */
export function useBills() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getBills = useCallback(async (month?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = month ? `?month=${encodeURIComponent(month)}` : '';
      return await api.get<BillsResponse>(`/bills${query}`);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBill = useCallback(async (dto: CreateBillDto) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.post<BillItem>('/bills', dto);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBill = useCallback(async (id: number, dto: UpdateBillDto) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.patch<BillItem>(`/bills/${id}`, dto);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteBill = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.delete<void>(`/bills/${id}`);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const payBill = useCallback(async (id: number, amount?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const body = amount != null ? { amount } : {};
      return await api.patch<BillItem>(`/bills/${id}/pay`, body);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unpayBill = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.patch<BillItem>(`/bills/${id}/unpay`);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getBills, createBill, updateBill, deleteBill, payBill, unpayBill, isLoading, error };
}
