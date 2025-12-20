// src/hooks/useFinance.ts
import { useApi } from './useApi';

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

export const financeService = {
    // Adicionar novo registro financeiro
    async addFinanceRecord(data: CreateFinanceDto) {
        const api = useApi('finance');
        return await api.post('/finance', data);
    },

    // Buscar todos os registros financeiros
    async getAllFinances(params?: QueryParams) {
        const api = useApi('finance');
        return await api.get<FinanceRecord[]>('/finance', {
            params: {
                startDate: params?.startDate,
                endDate: params?.endDate,
            },
        });
    },

    // Buscar resumo financeiro
    async getFinanceSummary(params?: QueryParams) {
        const api = useApi('finance');
        return await api.get<FinanceSummary>('/finance/summary', {
            params: {
                startDate: params?.startDate,
                endDate: params?.endDate,
            },
        });
    },

    // Buscar dados do dashboard
    async getDashboardData(params?: QueryParams) {
        const api = useApi('finance');
        return await api.get<DashboardData>('/finance/dashboard', {
            params: {
                startDate: params?.startDate,
                endDate: params?.endDate,
            },
        });
    },
};

// Hook personalizado para finanças
export function useFinance() {
    const api = useApi<FinanceRecord[]>('finance');

    const addFinanceRecord = async (data: CreateFinanceDto) => {
        return await api.post('/finance', data);
    };

    const getAllFinances = async (params?: QueryParams) => {
        return await api.get('/finance', {
            params: {
                startDate: params?.startDate,
                endDate: params?.endDate,
            }
        });
    };

    const getFinanceSummary = async (params?: QueryParams) => {
        const summaryApi = useApi<FinanceSummary>('finance');
        return await summaryApi.get('/finance/summary', {
            params: {
                startDate: params?.startDate,
                endDate: params?.endDate,
            }
        });
    };

    const getDashboardData = async (params?: QueryParams) => {
        const dashboardApi = useApi<DashboardData>('finance');
        return await dashboardApi.get('/finance/dashboard', {
            params: {
                startDate: params?.startDate,
                endDate: params?.endDate,
            }
        });
    };

    return {
        // Métodos principais
        addFinanceRecord,
        getAllFinances,
        getFinanceSummary,
        getDashboardData,

        // Aliases para compatibilidade
        getRecords: getAllFinances, // Adicione esta linha
        addRecord: addFinanceRecord, // Se também quiser usar addRecord

        // Estado
        data: api.data,
        error: api.error,
        isLoading: api.isLoading,
        isSuccess: api.isSuccess,
        isError: api.isError,
        reset: api.reset,

        // Métodos curtos do useApi
        get: api.get,
        post: api.post,
        put: api.put,
        patch: api.patch,
        del: api.del,
        execute: api.execute,
    };
}
