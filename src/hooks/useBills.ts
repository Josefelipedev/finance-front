import { useCallback, useState } from 'react';
import api from '../services/api';

// ===== Tipos da resposta de GET /bills =====
export interface BillItem {
  id: number;
  description: string;
  amount: number;
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

export interface BillsResponse {
  month: string; // "YYYY-MM"
  items: BillItem[];
  totalPending: number;
  totalPaid: number;
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

  const payBill = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.patch<BillItem>(`/bills/${id}/pay`);
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

  return { getBills, payBill, unpayBill, isLoading, error };
}
