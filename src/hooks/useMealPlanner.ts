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
  /** Preço realmente pago; manda no total ao fechar a lista (C4). */
  actualPrice: number | null;
  category: string | null;
  purchased: boolean;
}

/**
 * O orçado contra o real.
 *
 * O `MealPlan.budget` era gravado em cada geração e nunca lido: a app sabia
 * quanto se tinha combinado gastar e quanto se gastou, e nunca pôs os dois
 * lado a lado.
 */
export interface BudgetComparison {
  /** Nulo = não havia orçamento. Diferente de um orçamento de zero. */
  budget: number | null;
  spent: number;
  /** `budget − spent`. Positivo = ainda sobra. Nulo sem orçamento. */
  delta: number | null;
  usedPct: number | null;
  status: 'no_budget' | 'under' | 'close' | 'over';
}

export interface MealShoppingList {
  id: number;
  totalEstimate: number | null;
  notified: boolean;
  items: MealShoppingItem[];
  /** Quando a lista foi fechada e virou despesa (C4). */
  closedAt?: string | null;
  financeId?: number | null;
  /**
   * O que vai comprado contra o orçamento da semana. Enquanto a lista está
   * aberta conta só o que já foi marcado — é esse o número que responde a
   * "ainda posso pôr isto no carrinho?".
   */
  budgetComparison?: BudgetComparison;
}

export interface MealPlan {
  id: number;
  /**
   * Quantos preços que ESTA pessoa pagou a IA usou nesta geração (F5).
   *
   * Só vem na resposta da geração, não ao reler o plano. Sem ele a feature era
   * invisível — e uma feature que ninguém consegue ver é indistinguível de uma
   * que não existe.
   */
  paidPricesUsed?: number;
  weekStart: string;
  /** Moeda em que os preços do plano foram gerados — não a da conta hoje. */
  currency?: string;
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

export interface ManualPlanBody {
  budget?: number;
  notes?: string;
  days: Array<{
    dayOfWeek: number;
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snacks?: string;
  }>;
  shoppingList?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    estimatedPrice?: number;
    category?: string;
  }>;
}

/** O teto alimentar de uma pessoa do casal. */
export interface FoodBudgetPart {
  userId: number;
  name: string;
  /** Já convertido para a moeda de exibição. Nulo enquanto não responder. */
  amount: number | null;
  /** O valor tal como foi escrito, na moeda em que foi escrito. */
  nativeAmount: number | null;
  nativeCurrency: string | null;
  answered: boolean;
}

/** Compatibilidade da API: contém as metas individuais convertidas. */
export interface HouseholdFoodBudget {
  /** Meta mensal da pessoa autenticada (campo mantido por compatibilidade). */
  monthly: number | null;
  /** Meta semanal da pessoa autenticada. */
  weekly: number | null;
  parts: FoodBudgetPart[];
  /** Campos legados; nenhuma decisão deve somar os tectos individuais. */
  partial: boolean;
  complete: boolean;
  currency: string;
}

/** The three axes that shape the menu: household, cuisine and nutritional goal. */
export interface MealPreferences {
  adults: number;
  children: number;
  cuisineStyle: string;
  dietGoal: string;
  favoriteFoods: string[];
  dislikedFoods: string[];
  mealPrepMode: boolean;
  onboarded: boolean;
  /** Adult-equivalent portions, computed by the API from adults + children. */
  servings: number;
  /** A meta desta pessoa. Nulo = ainda não respondeu (≠ respondeu zero). */
  monthlyFoodBudget: number | null;
  foodBudgetCurrency: string | null;
  /** Teto desta pessoa convertido para a moeda do perfil, por semana. */
  weeklyFoodBudget: number | null;
  foodBudget: HouseholdFoodBudget;
}

export type SavePreferencesBody = Partial<
  Omit<MealPreferences, 'onboarded' | 'servings' | 'foodBudget'>
> & {
  markOnboarded?: boolean;
  /** `null` volta a "ainda não respondi"; omitir não mexe. */
  monthlyFoodBudget?: number | null;
};

export interface PreferenceOption {
  value: string;
  label: string;
}

export interface PreferenceOptions {
  cuisineStyles: PreferenceOption[];
  dietGoals: PreferenceOption[];
}

export interface NotifyResult {
  sent: boolean;
  reason?: string;
}

/** Matches the Android client's read timeout for the same endpoint (180s). */
const GENERATE_TIMEOUT_MS = 180_000;

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

  const getPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.get<MealPreferences>('/meal-planner/preferences');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePreferences = useCallback(async (data: SavePreferencesBody) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.patch<MealPreferences>('/meal-planner/preferences', data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPreferenceOptions = useCallback(async () => {
    return api.get<PreferenceOptions>('/meal-planner/preferences/options');
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
      // AI generation (prices pre-fetch + LLM with provider fallback) runs well past
      // the client's 15s default, which made this call always time out.
      const data = await api.post<MealPlan>('/meal-planner/generate', body, {
        timeout: GENERATE_TIMEOUT_MS,
      });
      setActivePlan(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createManualPlan = useCallback(async (body: ManualPlanBody) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.post<MealPlan>('/meal-planner/manual', body);
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

  const updateItemPrice = useCallback(async (itemId: number, actualPrice: number | null) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.patch(`/meal-planner/item/${itemId}/price`, { actualPrice });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fecha a lista e regista a despesa do que se comprou (C4). O total é somado
   * no servidor, a partir do preço pago (ou do estimado, quando falta).
   *
   * Com `accountId`, a despesa sai também do saldo dessa conta bancária — sem
   * ele, o dinheiro saía do razão e nenhuma conta dava por isso.
   */
  const closeShoppingList = useCallback(async (options?: { accountId?: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.post('/meal-planner/shopping/close', {
        ...(options?.accountId ? { accountId: options.accountId } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Reabre a lista e apaga a despesa que ela gerou. */
  const reopenShoppingList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.post('/meal-planner/shopping/reopen', {});
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
    getPreferences,
    savePreferences,
    getPreferenceOptions,
    saveSchedule,
    generatePlan,
    createManualPlan,
    toggleItem,
    updateItemPrice,
    closeShoppingList,
    reopenShoppingList,
    sendNotification,
    getPlans,
    deletePlan,
    clearHistory,
  };
}
