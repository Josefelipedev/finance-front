// src/hooks/useGoals.ts
import { useApi } from './useApi';
import { useState, useCallback } from 'react';

export interface Goal {
  id: number;
  name: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELED';
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
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELED';
}

export interface UpdateGoalDto extends Partial<CreateGoalDto> {}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const api = useApi<Goal[]>('finance');

  const getAllGoals = useCallback(async () => {
    try {
      const response = await api.get('/goals');
      if (response) {
        setGoals(response);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const getGoalById = async (id: number) => {
    const goalApi = useApi<Goal>('finance');
    return await goalApi.get(`/goals/${id}`);
  };

  const createGoal = async (data: CreateGoalDto) => {
    try {
      const response = await api.post('/goals', data);
      // Atualizar lista local
      if (response) {
        setGoals((prev) => [...prev, response]);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateGoal = async (id: number, data: UpdateGoalDto) => {
    try {
      const response = await api.put(`/goals/${id}`, data);
      // Atualizar lista local
      if (response) {
        setGoals((prev) => prev.map((goal) => (goal.id === id ? response : goal)));
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const deleteGoal = async (id: number) => {
    try {
      await api.del(`/goals/${id}`);
      // Remover da lista local
      setGoals((prev) => prev.filter((goal) => goal.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Calcula o progresso da meta em porcentagem
  const calculateGoalProgress = useCallback((goal: Goal): number => {
    if (goal.targetValue === 0) return 0;
    const progress = (goal.currentValue / goal.targetValue) * 100;
    return Math.min(100, Math.max(0, progress)); // Limita entre 0 e 100
  }, []);

  // Verifica se a meta está atrasada
  const isGoalOverdue = useCallback((goal: Goal): boolean => {
    if (!goal.endDate || goal.status !== 'ACTIVE') return false;
    const endDate = new Date(goal.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove hora para comparar apenas datas
    return endDate < today;
  }, []);

  // Filtra metas por status
  const filterGoalsByStatus = useCallback(
    (status: Goal['status']) => {
      return goals.filter((goal) => goal.status === status);
    },
    [goals]
  );

  // Calcula estatísticas gerais
  const getGoalsStats = useCallback(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE').length;
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetValue, 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentValue, 0);
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    return {
      totalGoals,
      completedGoals,
      activeGoals,
      totalTarget,
      totalCurrent,
      overallProgress,
    };
  }, [goals]);

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
    getGoalsStats,

    // Estado
    data: goals,
    setGoals,
    error: api.error,
    isLoading: api.isLoading,
    isSuccess: api.isSuccess,
    isError: api.isError,
    reset: api.reset,
  };
}
