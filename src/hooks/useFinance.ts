import { useState } from 'react';
import api from '../services/api';

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

export const useFinance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [summaryData, setSummaryData] = useState<FinanceSummary | null>(null);

  const addFinanceRecord = async (data: CreateFinanceDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/finance', data);
      // Atualiza a lista de registros
      setRecords((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllFinances = async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/finance', {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      setRecords(response.data);
      return response.data;
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
      const response = await api.get('/finance/summary', {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      setSummaryData(response.data);
      return response.data;
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
      const response = await api.get('/finance/dashboard', {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      setDashboardData(response.data);
      return response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFinanceRecord = async (id: number, data: Partial<CreateFinanceDto>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put(`/finance/${id}`, data);
      // Atualiza o registro na lista
      setRecords((prev) => prev.map((record) => (record.id === id ? response.data : record)));
      return response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFinanceRecord = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/finance/${id}`);
      // Remove o registro da lista
      setRecords((prev) => prev.filter((record) => record.id !== id));
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          transactions: dashboardData.transactions.filter((tx) => tx.id !== id.toString()),
        });
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllData = async (params?: QueryParams) => {
    try {
      await Promise.all([
        getAllFinances(params),
        getDashboardData(params),
        getFinanceSummary(params),
      ]);
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
      throw err;
    }
  };

  return {
    // Métodos CRUD principais
    addFinanceRecord,
    getAllFinances,
    getFinanceSummary,
    getDashboardData,
    updateFinanceRecord,
    deleteFinanceRecord,
    refreshAllData,

    // Aliases para compatibilidade
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

    // Funções de reset
    resetError: () => setError(null),
    resetData: () => {
      setRecords([]);
      setDashboardData(null);
      setSummaryData(null);
    },
  };
};
