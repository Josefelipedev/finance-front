import { useCallback, useState } from 'react';
import api from '../services/api';

// ===================== TIPOS =====================

/** Os três baldes em que a regra divide o que sai. */
export type Bucket = 'needs' | 'wants' | 'savings';

/** De onde veio o balde de uma categoria. Um palpite não é uma decisão. */
export type BucketSource = 'manual' | 'guess' | 'unknown';

/** As quatro famílias que não são a divisão em três. */
export type RuleKind =
  | 'ceiling'
  | 'reserve'
  | 'savings_rate'
  | 'pay_yourself_first';

export type RuleUnit = 'pct' | 'months' | 'money';
export type RuleStatus = 'ok' | 'close' | 'broken' | 'unknown';

export interface RulePreset {
  key: string;
  name: string;
  description: string;
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
}

export interface BucketVerdict {
  bucket: Bucket;
  targetPct: number;
  targetAmount: number;
  actualAmount: number;
  /** Nulo quando não há receita no período — não há com que comparar. */
  actualPct: number | null;
  deltaAmount: number;
}

/** O veredicto de UMA regra, no mesmo formato para as cinco famílias. */
export interface RuleCheck {
  id: number | 'split';
  kind: RuleKind | 'split';
  label: string;
  status: RuleStatus;
  actual: number;
  target: number;
  unit: RuleUnit;
  message: string;
}

export interface StoredRule {
  id: number;
  kind: RuleKind;
  bucket: string | null;
  categoryId: number | null;
  target: number;
  unit: RuleUnit;
  currency: string | null;
  isActive: boolean;
  /** Nulo quando a regra está desligada — uma regra em pausa não se julga. */
  check: RuleCheck | null;
}

export interface RuleCategory {
  categoryId: number | null;
  name: string;
  color: string | null;
  monthlyAmount: number;
  bucket: Bucket | null;
  source: BucketSource;
}

export interface RuleMonth {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface RulesOverview {
  split: {
    preset: string;
    needsPct: number;
    wantsPct: number;
    savingsPct: number;
    /** Ninguém escolheu ainda — o ecrã convida em vez de afirmar. */
    isDefault: boolean;
  };
  presets: RulePreset[];
  verdict: {
    income: number;
    buckets: BucketVerdict[];
    unclassifiedAmount: number;
    leftover: number;
    hasIncome: boolean;
  };
  rules: StoredRule[];
  checks: RuleCheck[];
  /** A pior de todas — a que o Dashboard mostra quando só cabe uma. */
  worst: RuleCheck | null;
  categories: RuleCategory[];
  uncategorizedAmount: number;
  /** Mês a mês, para se ver se isto está a melhorar ou a piorar. */
  history: RuleMonth[];
  basis: {
    monthsCovered: number;
    lookbackMonths: number;
    window: { start: string; end: string };
    partialMonth: boolean;
    netWorth: number;
    netWorthKnown: boolean;
    monthlyExpense: number;
  };
  displayCurrency: string;
  rateDate: string | null;
  unconvertedCurrencies: string[];
  outOfRangeDates?: boolean;
}

/** O que cabe num cartão do Dashboard. */
export interface RulesSummary {
  split: RulesOverview['split'];
  verdict: RulesOverview['verdict'];
  total: number;
  ok: number;
  broken: number;
  worst: RuleCheck | null;
  pendingCategories: number;
  displayCurrency: string;
}

export interface RuleInput {
  kind?: RuleKind;
  target?: number;
  bucket?: string | null;
  categoryId?: number | null;
  isActive?: boolean;
}

// ===================== HOOK =====================

/**
 * As regras do dinheiro.
 *
 * **Todas as escritas devolvem a visão inteira**, já refeita pelo servidor.
 * Mudar um alvo ou arrumar uma categoria muda o veredicto de todas as outras
 * regras; ir buscar o resultado num segundo pedido deixava o ecrã um instante
 * a contradizer-se — o alvo novo com o veredicto velho.
 */
export function useRules() {
  const [overview, setOverview] = useState<RulesOverview | null>(null);
  const [summary, setSummary] = useState<RulesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<RulesOverview>('/rules');
      setOverview(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const data = await api.get<RulesSummary>('/rules/summary');
      setSummary(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  /** Envolve uma escrita: guarda o que voltou e mantém o `isSaving` honesto. */
  const write = useCallback(async (action: Promise<RulesOverview>) => {
    setIsSaving(true);
    try {
      const data = await action;
      setOverview(data);
      return data;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveSplit = useCallback(
    (input: {
      preset?: string;
      needsPct?: number;
      wantsPct?: number;
      savingsPct?: number;
    }) => write(api.put<RulesOverview>('/rules/split', input)),
    [write],
  );

  const setCategoryBuckets = useCallback(
    (items: { categoryId: number; bucket: Bucket | null }[]) =>
      write(api.put<RulesOverview>('/rules/categories', { items })),
    [write],
  );

  const createRule = useCallback(
    (input: RuleInput) => write(api.post<RulesOverview>('/rules', input)),
    [write],
  );

  const updateRule = useCallback(
    (id: number, input: RuleInput) =>
      write(api.patch<RulesOverview>(`/rules/${id}`, input)),
    [write],
  );

  const deleteRule = useCallback(
    (id: number) => write(api.delete<RulesOverview>(`/rules/${id}`)),
    [write],
  );

  return {
    overview,
    summary,
    isLoading,
    isSaving,
    error,
    load,
    loadSummary,
    saveSplit,
    setCategoryBuckets,
    createRule,
    updateRule,
    deleteRule,
  };
}
