import { useCallback, useState } from 'react';
import api from '../services/api';

// ===== Tipos da resposta de GET /bills =====
export type BillType = 'expense' | 'income';

export interface BillItem {
  id: number;
  /** Dono da conta — o workspace é do casal, e há ecrãs que filtram por pessoa. */
  userId: number;
  /** id da recorrente que gerou a conta; null = conta avulsa */
  recurringId: number | null;
  type: BillType; // 'expense' (a pagar) | 'income' (a receber)
  description: string;
  amount: number; // valor previsto, na moeda nativa
  paidAmount: number | null; // valor efetivamente pago/recebido, na moeda nativa (null quando pendente)
  currency: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  /** Conta bancária de onde sai (ou onde entra). Null = não foi dito. */
  accountId: number | null;
  dueDate: string; // ISO date
  status: 'pending' | 'paid';
  paidAt: string | null;
  overdue: boolean; // pendente e já venceu
  carriedOver: boolean; // veio de um mês anterior (atrasada)
  /** Posição desta ocorrência dentro do contrato recorrente. */
  installment: number | null;
  /** Total contratado; null quando a série só tem uma data de fim. */
  installments: number | null;
  /** Último dia da série recorrente, como data civil ISO. */
  until: string | null;
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
  accountId?: number;
}

/** Corpo de edição de uma ocorrência pendente (PATCH /bills/:id). */
export interface UpdateBillDto {
  description?: string;
  amount?: number;
  dueDate?: string; // "YYYY-MM-DD"
  categoryId?: number;
  /** `null` desliga a conta bancária. */
  accountId?: number | null;
}

/**
 * O que fica em cada conta bancária depois de pagar o que falta.
 *
 * Os valores vêm na moeda da **própria conta** (não na de exibição): uma conta
 * em euros fala em euros. As contas pagas já estão dentro do `currentBalance`,
 * por isso só as pendentes entram no `incoming`/`outgoing`.
 */
export interface BillAccountForecast {
  id: number;
  bankName: string;
  currency: string;
  iconName?: string | null;
  ownerId: number;
  ownerName: string | null;
  /** O que o banco tem hoje (saldo derivado). */
  currentBalance: number;
  /** Entradas que ainda não caíram (salários, sobretudo). */
  incoming: number;
  /** Contas desta conta que ainda não foram pagas (inclui atrasadas). */
  outgoing: number;
  /** currentBalance + incoming − outgoing. */
  projectedBalance: number;
  billCount: number;
}

export interface BillsForecast {
  items: BillAccountForecast[];
  /** Pendentes sem conta bancária dita — na moeda de exibição. */
  unassigned: {
    incoming: number;
    outgoing: number;
    count: number;
    currency: string;
  };
  /** Moedas somadas sem conversão — os saldos previstos são aproximados. */
  unconvertedCurrencies?: string[];
}

export interface BillMonthForecast {
  month: string;
  expense: number;
  income: number;
  net: number;
}

/** A fila do casal, já convertida para a moeda de exibição. */
export interface BillsMonthlyForecast {
  months: BillMonthForecast[];
  heaviest: string | null;
  relief: string | null;
  displayCurrency: string;
  rateDate: string | null;
  unconvertedCurrencies: string[];
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
  /**
   * O que sobra em cada conta bancária. `null` num mês já fechado: a previsão
   * parte do saldo de hoje e não sabe responder pelo passado.
   */
  accounts?: BillsForecast | null;
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

  const getForecast = useCallback(async (months = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.get<BillsMonthlyForecast>(
        `/bills/forecast?months=${encodeURIComponent(months)}`
      );
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

  return {
    getBills,
    getForecast,
    createBill,
    updateBill,
    deleteBill,
    payBill,
    unpayBill,
    isLoading,
    error,
  };
}
