import { useCallback, useState } from 'react';
import api from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type MealDayType = 'WORK' | 'OFF' | 'HALF_OFF';

export interface MealScheduleItem {
  dayOfWeek: number;
  dayType: MealDayType;
}

export interface MealPlanDay {
  id: number;
  dayOfWeek: number;
  date: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  snacks: string | null;
  calories: number | null;
}

export interface MealShoppingItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number | null;
  category: string | null;
  purchased: boolean;
}

export interface MealShoppingList {
  id: number;
  totalEstimate: number | null;
  notified: boolean;
  items: MealShoppingItem[];
}

export interface MealPlan {
  id: number;
  weekStart: string;
  active: boolean;
  days: MealPlanDay[];
  shoppingList: MealShoppingList | null;
}

export interface MealProfileData {
  height: number | null;
  weight: number | null;
  activityLevel: string | null;
  dietaryPreferences: string[];
}

export interface GeneratePlanBody {
  budget?: number;
}

export interface NotifyResult {
  sent: boolean;
  reason?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMealPlanner() {
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.get<MealScheduleItem[]>('/meal-planner/schedule');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActivePlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<MealPlan | null>('/meal-planner/active');
      setActivePlan(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.get<MealProfileData>('/meal-planner/profile');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (data: MealProfileData) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.patch<MealProfileData>('/meal-planner/profile', data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSchedule = useCallback(async (schedule: MealScheduleItem[]) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.post('/meal-planner/schedule', { schedule });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generatePlan = useCallback(async (body: GeneratePlanBody) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.post<MealPlan>('/meal-planner/generate', body);
      setActivePlan(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleItem = useCallback(async (itemId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.patch(`/meal-planner/item/${itemId}/toggle`, {});
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendNotification = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.post<NotifyResult>('/meal-planner/notify', {});
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<MealPlan[]>('/meal-planner/plans');
      setPlans(data ?? []);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePlan = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.delete(`/meal-planner/plans/${id}`);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.delete('/meal-planner/plans/history');
      setPlans([]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    activePlan,
    plans,
    isLoading,
    error,
    getSchedule,
    getActivePlan,
    getProfile,
    saveProfile,
    saveSchedule,
    generatePlan,
    toggleItem,
    sendNotification,
    getPlans,
    deletePlan,
    clearHistory,
  };
}
