// src/hooks/useGoals.ts
import { useState, useCallback } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

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
  category?: string;
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

export type UpdateGoalDto = Partial<CreateGoalDto>;

// ===================== HOOK =====================

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ===================== CRUD =====================

  const getAllGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Goal[]>('/goals');

      if (Array.isArray(response)) {
        setGoals(response);
        return response;
      }

      throw new Error('Lista de metas inválida');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getGoalById = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const goal = await api.get<Goal>(`/goals/${id}`);

      if (goal) {
        return goal;
      }

      throw new Error('Meta não encontrada');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createGoal = async (data: CreateGoalDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const goal = await api.post<Goal>('/goals', data);

      if (goal) {
        setGoals((prev) => [...prev, goal]);
        return goal;
      }

      throw new Error('Falha ao criar meta');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoal = async (id: number, data: UpdateGoalDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await api.put<Goal>(`/goals/${id}`, data);

      if (updated) {
        setGoals((prev) => prev.map((goal) => (goal.id === id ? updated : goal)));
        return updated;
      }

      throw new Error('Falha ao atualizar meta');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGoal = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<boolean>(`/goals/${id}`);

      setGoals((prev) => prev.filter((goal) => goal.id !== id));
      return true;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== UTILITIES =====================

  const calculateGoalProgress = useCallback((goal: Goal): number => {
    if (goal.targetValue === 0) return 0;
    const progress = (goal.currentValue / goal.targetValue) * 100;
    return Math.min(100, Math.max(0, progress));
  }, []);

  const isGoalOverdue = useCallback((goal: Goal): boolean => {
    if (!goal.endDate || goal.status !== 'ACTIVE') return false;

    const endDate = new Date(goal.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return endDate < today;
  }, []);

  const filterGoalsByStatus = useCallback(
    (status: Goal['status']) => {
      return goals.filter((goal) => goal.status === status);
    },
    [goals]
  );

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

  // ===================== PUBLIC API =====================

  return {
    // CRUD
    getAllGoals,
    getGoalById,
    createGoal,
    updateGoal,
    deleteGoal,

    // Utilidades
    calculateGoalProgress,
    isGoalOverdue,
    filterGoalsByStatus,
    getGoalsStats,

    // Estado
    data: goals,
    setGoals,
    isLoading,
    error,

    // Helpers
    resetError: () => setError(null),
  };
}
