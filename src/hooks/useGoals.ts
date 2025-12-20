
// src/hooks/useGoals.ts
import { useApi } from './useApi';

export interface Goal {
    id: number;
    name: string;
    description?: string;
    targetValue: number;
    currentValue: number;
    startDate?: string;
    endDate?: string;
    status: 'active' | 'completed' | 'cancelled';
    userId: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateGoalDto {
    name: string;
    description?: string;
    targetValue: number;
    currentValue?: number;
    startDate?: string;
    endDate?: string;
    status?: 'active' | 'completed' | 'cancelled';
}

export interface UpdateGoalDto extends Partial<CreateGoalDto> {}

export const goalsService = {
    async getAllGoals() {
        const api = useApi('finance');
        return await api.get<Goal[]>('/goals');
    },

    async getGoalById(id: number) {
        const api = useApi('finance');
        return await api.get<Goal>(`/goals/${id}`);
    },

    async createGoal(data: CreateGoalDto) {
        const api = useApi('finance');
        return await api.post('/goals', data);
    },

    async updateGoal(id: number, data: UpdateGoalDto) {
        const api = useApi('finance');
        return await api.put(`/goals/${id}`, data);
    },

    async deleteGoal(id: number) {
        const api = useApi('finance');
        return await api.del(`/goals/${id}`);
    },
};

// Hook personalizado para metas
export function useGoals() {
    const api = useApi<Goal[]>('finance');

    const getAllGoals = async () => {
        return await api.get('/goals');
    };

    const getGoalById = async (id: number) => {
        const goalApi = useApi<Goal>('finance');
        return await goalApi.get(`/goals/${id}`);
    };

    const createGoal = async (data: CreateGoalDto) => {
        return await api.post('/goals', data);
    };

    const updateGoal = async (id: number, data: UpdateGoalDto) => {
        return await api.put(`/goals/${id}`, data);
    };

    const deleteGoal = async (id: number) => {
        return await api.del(`/goals/${id}`);
    };

    // Calcula o progresso da meta em porcentagem
    const calculateGoalProgress = (goal: Goal): number => {
        if (goal.targetValue === 0) return 0;
        return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
    };

    // Verifica se a meta está atrasada
    const isGoalOverdue = (goal: Goal): boolean => {
        if (!goal.endDate || goal.status === 'completed') return false;
        const endDate = new Date(goal.endDate);
        const today = new Date();
        return endDate < today;
    };

    // Filtra metas por status
    const filterGoalsByStatus = (goals: Goal[], status: Goal['status']) => {
        return goals.filter(goal => goal.status === status);
    };

    return {
        // Métodos CRUD
        getAllGoals,
        getGoalById,
        createGoal,
        updateGoal,
        deleteGoal,

        // Métodos utilitários
        calculateGoalProgress,
        isGoalOverdue,
        filterGoalsByStatus,

        // Estado
        data: api.data,
        error: api.error,
        isLoading: api.isLoading,
        isSuccess: api.isSuccess,
        isError: api.isError,
        reset: api.reset,
    };
}