// src/hooks/usePlanning.ts
import { useCallback, useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

export type FlowType = 'income' | 'expense';
export type EventFrequency = 'monthly' | 'yearly' | 'once';

export interface PlanEvent {
  id: number;
  scenarioId: number;
  name: string;
  type: FlowType;
  amount: number;
  currency: string;
  frequency: EventFrequency;
  /** YYYY-MM */
  startMonth: string;
  endMonth: string | null;
  categoryId: number | null;
  isActive: boolean;
  growsWithInflation: boolean;
}

export interface PlanScenario {
  id: number;
  name: string;
  description: string | null;
  isBaseline: boolean;
  horizonYears: number;
  inflationPct: number;
  incomeGrowthPct: number;
  savingsReturnPct: number;
  startingNetWorth: number | null;
  events: PlanEvent[];
}

export interface ProjectionMonth {
  month: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
}

export interface ProjectionYear {
  year: number;
  income: number;
  expense: number;
  net: number;
  endBalance: number;
}

export interface BaselineLine {
  categoryId: number | null;
  name: string;
  type: FlowType;
  monthlyAmount: number;
}

/**
 * Um compromisso contratado: o salário, a renda, a prestação que acaba em
 * junho. Conta para a frente pelo valor cheio — é o que a app sabe de certeza,
 * ao contrário da média do histórico, que é uma inferência.
 */
export interface Commitment {
  name: string;
  type: FlowType;
  monthlyAmount: number;
  startsAt: string;
  /** Nulo = sem fim conhecido. */
  endsAfter: string | null;
}

export interface Projection {
  scenario: Omit<PlanScenario, 'events' | 'id'> & { id: number | null };
  months: ProjectionMonth[];
  years: ProjectionYear[];
  summary: {
    startBalance: number;
    endBalance: number;
    totalIncome: number;
    totalExpense: number;
    totalNet: number;
    monthlySurplus: number;
  };
  baseline: {
    /** O que varia, já sem o que os contratos explicam. */
    lines: BaselineLine[];
    /** Tudo o que está contratado — salário, renda, prestações. */
    commitments: Commitment[];
    /** Só os que acabam. Subconjunto de `commitments`. */
    endingCommitments: {
      name: string;
      type: FlowType;
      monthlyAmount: number;
      endsAfter: string;
    }[];
    window: { start: string; end: string };
    monthsCovered: number;
    netWorth: number;
    /** Falso = não há contas bancárias registadas; o património não é zero, é desconhecido. */
    netWorthKnown: boolean;
  };
  displayCurrency: string;
  rateDate: string | null;
  unconvertedCurrencies: string[];
}

export interface GoalPace {
  id: number;
  name: string;
  targetValue: number;
  currentValue: number;
  priority: number;
  remaining: number;
  monthsRemaining: number | null;
  requiredMonthly: number | null;
  plannedMonthly: number | null;
  monthsAtPlannedPace: number | null;
  allocatedMonthly: number;
  funded: boolean;
  shortfallMonthly: number;
  overdue: boolean;
}

export interface GoalPlan {
  goals: GoalPace[];
  totalRequiredMonthly: number;
  monthlySurplus: number;
  unallocatedMonthly: number;
  feasible: boolean;
  scenarioId: number | null;
  scenarioName: string;
  displayCurrency: string;
}

export interface PlanningOverview {
  scenarios: PlanScenario[];
  projection: Projection;
  goalPlan: GoalPlan;
}

export interface YearPlanItem {
  categoryId: number;
  categoryName: string;
  color: string | null;
  iconName: string | null;
  type: FlowType;
  plannedAmount: number | null;
  monthlyPlanned: number | null;
  realizedAmount: number;
  /** O que a média dos últimos 12 meses daria neste ano. */
  baselineAmount: number;
  difference: number | null;
  progressPct: number | null;
  note: string | null;
}

export interface YearPlan {
  year: number;
  items: YearPlanItem[];
  totals: {
    plannedIncome: number;
    plannedExpense: number;
    realizedIncome: number;
    realizedExpense: number;
    baselineIncome: number;
    baselineExpense: number;
  };
  displayCurrency: string;
  rateDate: string | null;
  unconvertedCurrencies: string[];
}

export interface ScenarioInput {
  name: string;
  description?: string | null;
  isBaseline?: boolean;
  horizonYears?: number;
  inflationPct?: number;
  incomeGrowthPct?: number;
  savingsReturnPct?: number;
  startingNetWorth?: number | null;
}

export interface EventInput {
  name: string;
  type: FlowType;
  amount: number;
  frequency?: EventFrequency;
  startMonth: string;
  endMonth?: string | null;
  categoryId?: number | null;
  isActive?: boolean;
  growsWithInflation?: boolean;
}

// ===================== HOOK =====================

/**
 * O planeamento dos próximos anos.
 *
 * Tudo o que se vê aqui é **derivado** — projeção, ritmo das metas, planeado
 * vs real — e o servidor é que faz as contas, com o histórico e as taxas de
 * câmbio que só ele tem. O hook só guarda o que voltou e volta a pedir quando
 * alguma premissa muda.
 */
export function usePlanning() {
  const [overview, setOverview] = useState<PlanningOverview | null>(null);
  const [yearPlan, setYearPlan] = useState<YearPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadOverview = useCallback(async (scenarioId?: number | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = scenarioId ? `?scenarioId=${scenarioId}` : '';
      const data = await api.get<PlanningOverview>(`/planning/overview${query}`);
      if (!data?.projection) throw new Error('Projeção inválida');
      setOverview(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadYearPlan = useCallback(async (year: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<YearPlan>(`/planning/years/${year}`);
      setYearPlan(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===================== CENÁRIOS =====================

  const createScenario = useCallback(async (input: ScenarioInput) => {
    setIsSaving(true);
    try {
      return await api.post<PlanScenario>('/planning/scenarios', input);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateScenario = useCallback(
    async (id: number, input: Partial<ScenarioInput>) => {
      setIsSaving(true);
      try {
        return await api.put<PlanScenario>(`/planning/scenarios/${id}`, input);
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const deleteScenario = useCallback(async (id: number) => {
    setIsSaving(true);
    try {
      await api.delete(`/planning/scenarios/${id}`);
      return true;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ===================== EVENTOS "E SE" =====================

  const createEvent = useCallback(async (scenarioId: number, input: EventInput) => {
    setIsSaving(true);
    try {
      return await api.post<PlanEvent>(
        `/planning/scenarios/${scenarioId}/events`,
        input,
      );
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateEvent = useCallback(async (id: number, input: Partial<EventInput>) => {
    setIsSaving(true);
    try {
      return await api.put<PlanEvent>(`/planning/events/${id}`, input);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteEvent = useCallback(async (id: number) => {
    setIsSaving(true);
    try {
      await api.delete(`/planning/events/${id}`);
      return true;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ===================== PLANO ANUAL =====================

  const saveYearPlan = useCallback(
    async (
      year: number,
      items: {
        categoryId: number;
        type: FlowType;
        plannedAmount: number;
        note?: string | null;
      }[],
    ) => {
      setIsSaving(true);
      try {
        const data = await api.put<YearPlan>(`/planning/years/${year}`, { items });
        setYearPlan(data);
        return data;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const deleteYearPlanItem = useCallback(async (year: number, categoryId: number) => {
    setIsSaving(true);
    try {
      await api.delete(`/planning/years/${year}/categories/${categoryId}`);
      return true;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    overview,
    yearPlan,
    isLoading,
    isSaving,
    error,
    loadOverview,
    loadYearPlan,
    createScenario,
    updateScenario,
    deleteScenario,
    createEvent,
    updateEvent,
    deleteEvent,
    saveYearPlan,
    deleteYearPlanItem,
    resetError: () => setError(null),
  };
}
