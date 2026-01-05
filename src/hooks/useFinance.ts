import { useState } from 'react';
import api from '../services/api';

// ===================== DTOs =====================

export interface CreateFinanceDto {
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  categoryId?: number;
  iconName?: string;
  referenceDate?: string;
}

export interface FinanceRecord {
  id: number;
  amount: number;
  type: 'income' | 'expense';
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

export interface FinanceSummary {
  totalGanhos: number;
  totalDespesas: number;
  saldo: number;
}

export interface DashboardData {
  totalBalance: number;
  totalExpense: number;
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
  }>;
}

export interface QueryParams {
  startDate?: string;
  endDate?: string;
}

// ===================== HOOK =====================

export const useFinance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [summaryData, setSummaryData] = useState<FinanceSummary | null>(null);

  // ===================== CREATE =====================

  const addFinanceRecord = async (data: CreateFinanceDto) => {
    setIsLoading(true);
    setError(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== READ =====================

  const getAllFinances = async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<FinanceRecord[]>('/finance', {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });

      if (Array.isArray(data)) {
        setRecords(data);
        return data;
      }

      throw new Error('Lista de finanças inválida');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getFinanceSummary = async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardData = async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== UPDATE =====================

  const updateFinanceRecord = async (id: number, data: Partial<CreateFinanceDto>) => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await api.put<FinanceRecord>(`/finance/${id}`, data);

      if (updated) {
        setRecords((prev) => prev.map((record) => (record.id === id ? updated : record)));
        return updated;
      }

      throw new Error('Falha ao atualizar registro');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== DELETE =====================

  const deleteFinanceRecord = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const deleted = await api.delete<boolean>(`/finance/${id}`);

      if (deleted !== false) {
        setRecords((prev) => prev.filter((record) => record.id !== id));

        if (dashboardData) {
          setDashboardData({
            ...dashboardData,
            transactions: dashboardData.transactions.filter((tx) => tx.id !== id.toString()),
          });
        }
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== REFRESH =====================

  const refreshAllData = async (params?: QueryParams) => {
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
  };

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
