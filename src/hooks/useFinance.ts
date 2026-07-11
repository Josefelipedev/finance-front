import { useCallback, useState } from 'react';
import api from '../services/api';

// ===================== DTOs =====================

export interface CreateFinanceDto {
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  categoryId?: number;
  iconName?: string;
  referenceDate?: string;
  currency?: string;
  accountId?: number;
}

export interface FinanceRecord {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  currency?: string;
  description: string | null;
  iconName: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  categoryId: number | null;
  referenceDate: string | null;
  category?: {
    id: number;
    name: string;
    color?: string;
    icon?: string;
  };
}

export interface CurrencyBreakdown {
  currency: string;
  ganhos: number;
  despesas: number;
}

export interface FinanceSummary {
  totalGanhos: number;
  totalDespesas: number;
  saldo: number;
  /** Moeda de exibição do usuário — os totais acima já vêm convertidos para ela */
  displayCurrency?: string;
  /** Data da taxa de câmbio usada na conversão (null = sem conversão necessária) */
  rateDate?: string | null;
  /** Somas nativas por moeda, sem conversão */
  byCurrency?: CurrencyBreakdown[];
  unconvertedCurrencies?: string[];
}

export interface DashboardData {
  totalBalance: number;
  totalExpense: number;
  displayCurrency?: string;
  rateDate?: string | null;
  byCurrency?: CurrencyBreakdown[];
  stats: {
    revenueLastWeek: number;
    foodLastWeek: number;
  };
  transactions: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    tag: string;
    amount: number;
    currency?: string;
  }>;
}

export interface QueryParams {
  startDate?: string;
  endDate?: string;
}

// ===================== HOOK =====================

export const useFinance = () => {
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [summaryData, setSummaryData] = useState<FinanceSummary | null>(null);

  const isLoading = loadingCount > 0;

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoadingCount((c) => c + 1);
    try {
      return await fn();
    } finally {
      setLoadingCount((c) => Math.max(0, c - 1));
    }
  }, []);

  // ===================== CREATE =====================

  const addFinanceRecord = useCallback(async (data: CreateFinanceDto) => {
    setError(null);
    return withLoading(async () => {
      try {
        const record = await api.post<FinanceRecord>('/finance', data);
        if (record) {
          setRecords((prev) => [record, ...prev]);
          return record;
        }
        throw new Error('Registro financeiro inválido');
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  // ===================== READ =====================

  const getAllFinances = useCallback(async (params?: QueryParams) => {
    setError(null);
    return withLoading(async () => {
      try {
        const res = await api.get<
          FinanceRecord[] | { data: FinanceRecord[]; meta?: unknown }
        >('/finance', {
          params: {
            startDate: params?.startDate,
            endDate: params?.endDate,
          },
        });
        // O endpoint é paginado e retorna { data, meta }; aceita também array cru.
        const list = Array.isArray(res) ? res : res?.data;
        if (Array.isArray(list)) {
          setRecords(list);
          return list;
        }
        throw new Error('Lista de finanças inválida');
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  const getFinanceSummary = useCallback(async (params?: QueryParams) => {
    setError(null);
    return withLoading(async () => {
      try {
        const summary = await api.get<FinanceSummary>('/finance/summary', {
          params: {
            startDate: params?.startDate,
            endDate: params?.endDate,
          },
        });
        if (summary) {
          setSummaryData(summary);
          return summary;
        }
        throw new Error('Resumo financeiro inválido');
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  const getDashboardData = useCallback(async (params?: QueryParams) => {
    setError(null);
    return withLoading(async () => {
      try {
        const dashboard = await api.get<DashboardData>('/finance/dashboard', {
          params: {
            startDate: params?.startDate,
            endDate: params?.endDate,
          },
        });
        if (dashboard) {
          setDashboardData(dashboard);
          return dashboard;
        }
        throw new Error('Dashboard inválido');
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  // ===================== UPDATE =====================

  const updateFinanceRecord = useCallback(async (id: number, data: Partial<CreateFinanceDto>) => {
    setError(null);
    return withLoading(async () => {
      try {
        const updated = await api.patch<FinanceRecord>(`/finance/${id}`, data);
        if (updated) {
          setRecords((prev) => prev.map((record) => (record.id === id ? updated : record)));
          return updated;
        }
        throw new Error('Falha ao atualizar registro');
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  // ===================== DELETE =====================

  const deleteFinanceRecord = useCallback(async (id: number) => {
    setError(null);
    return withLoading(async () => {
      try {
        // A API lança erro em caso de falha (cai no catch); se resolveu, removeu.
        await api.delete(`/finance/${id}`);
        setRecords((prev) => prev.filter((record) => record.id !== id));
        // Atualização funcional: mantém a função estável (sem depender de dashboardData)
        setDashboardData((prev) =>
          prev
            ? {
                ...prev,
                transactions: prev.transactions.filter((tx) => tx.id !== id.toString()),
              }
            : prev,
        );
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  // ===================== REFRESH =====================

  const refreshAllData = useCallback(async (params?: QueryParams) => {
    try {
      await Promise.all([
        getAllFinances(params),
        getDashboardData(params),
        getFinanceSummary(params),
      ]);
    } catch (err) {
      console.error('Erro ao atualizar dados financeiros:', err);
      throw err;
    }
  }, [getAllFinances, getDashboardData, getFinanceSummary]);

  // ===================== PUBLIC API =====================

  return {
    // CRUD principal
    addFinanceRecord,
    getAllFinances,
    getFinanceSummary,
    getDashboardData,
    updateFinanceRecord,
    deleteFinanceRecord,
    refreshAllData,

    // Aliases
    addRecord: addFinanceRecord,
    getRecords: getAllFinances,
    updateRecord: updateFinanceRecord,
    deleteRecord: deleteFinanceRecord,

    // Estado
    records,
    dashboardData,
    summaryData,
    isLoading,
    error,

    // Helpers
    resetError: () => setError(null),
    resetData: () => {
      setRecords([]);
      setDashboardData(null);
      setSummaryData(null);
    },
  };
};
