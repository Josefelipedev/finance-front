import { useCallback, useState } from 'react';
import api from '../services/api';

// ===================== TIPOS =====================

export type DebtKind =
  | 'CREDIT_CARD'
  | 'LOAN'
  | 'INSTALLMENT'
  | 'OVERDRAFT'
  | 'PERSONAL'
  | 'OTHER';

export type DebtStatus = 'ACTIVE' | 'PAID' | 'ARCHIVED';

export type PayoffStrategy = 'SNOWBALL' | 'AVALANCHE' | 'CUSTOM';

export interface Debt {
  id: number;
  userId: number;
  name: string;
  kind: DebtKind;
  currency: string;
  originalAmount: number;
  currentBalance: number;
  /** Juro nominal ANUAL em percentagem (12.5 = 12,5% a.a.). */
  annualInterestRate: number;
  minimumPayment: number;
  dueDay: number | null;
  status: DebtStatus;
  order: number;
  iconName: string | null;
  recurringId: number | null;
  accountId: number | null;
  /** Derivados pelo servidor — o caminho andado, que o saldo sozinho não conta. */
  amountPaid: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: number;
  debtId: number;
  userId: number;
  amount: number;
  currency: string;
  /** A parte que foi juro e por isso NÃO baixou o saldo. */
  interestPortion: number;
  financeId: number | null;
  financeAutoCreated: boolean;
  createdAt: string;
}

/** Uma dívida na fila de ataque, já convertida para a moeda de exibição. */
export interface QueuedDebt {
  debtId: number;
  name: string;
  position: number;
  months: number | null;
  totalPaid: number;
  totalInterest: number;
  currency: string;
  nativeCurrency: string;
  nativeBalance: number;
  balance: number;
  annualInterestRate: number;
  minimumPayment: number;
  freeOn: string | null;
}

export interface PayoffMonth {
  month: number;
  paid: number;
  interest: number;
  principal: number;
  balance: number;
  clearedDebtIds: number[];
}

export interface StrategySummary {
  feasible: boolean;
  months: number | null;
  totalPaid: number;
  totalInterest: number;
  freeOn: string | null;
}

export interface PayoffPlan {
  strategy: PayoffStrategy;
  extraMonthly: number;
  displayCurrency: string;
  totalBalance: number;
  totalMinimum: number;
  monthlyBudget: number;
  /** `false` = o dinheiro do mês não cobre o juro; a dívida nunca fecha. */
  feasible: boolean;
  months: number | null;
  /** O mês civil em que se fica livre, como `AAAA-MM`. */
  freeOn: string | null;
  totalPaid: number;
  totalInterest: number;
  queue: QueuedDebt[];
  schedule: PayoffMonth[];
  comparison: {
    minimumOnly: StrategySummary;
    snowball: StrategySummary;
    avalanche: StrategySummary;
    avalancheSavesInterest: number;
    monthsSavedByExtra: number | null;
    interestSavedByExtra: number | null;
  };
  unconvertedCurrencies: string[];
  rateDate: string | null;
}

/** O que já está na app e podia ser uma dívida. */
export interface ImportCandidate {
  source: 'recurring' | 'account';
  recurringId?: number;
  accountId?: number;
  name: string;
  currency: string;
  currentBalance: number;
  originalAmount: number;
  minimumPayment: number;
  dueDay: number | null;
  kind: DebtKind;
}

export interface DebtInput {
  name: string;
  kind?: DebtKind;
  currency?: string;
  currentBalance: number;
  originalAmount?: number;
  annualInterestRate?: number;
  minimumPayment?: number;
  dueDay?: number | null;
  status?: DebtStatus;
  order?: number;
}

// ===================== HOOK =====================

/**
 * As dívidas e o plano de as pagar.
 *
 * **O plano é sempre recarregado depois de uma escrita.** Mudar um saldo, um
 * juro ou o extra do mês muda a fila inteira e a data de libertação — mostrar
 * a lista nova com o plano velho era o ecrã a contradizer-se a si próprio
 * durante o tempo em que ninguém carrega em nada.
 */
export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [plan, setPlan] = useState<PayoffPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPlan = useCallback(async () => {
    const data = await api.get<PayoffPlan>('/debts/plan');
    setPlan(data);
    return data;
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [list, planData] = await Promise.all([
        api.get<Debt[]>('/debts'),
        api.get<PayoffPlan>('/debts/plan'),
      ]);
      setDebts(Array.isArray(list) ? list : []);
      setPlan(planData);
      return { debts: list, plan: planData };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Envolve uma escrita: refaz a lista e o plano, e mantém o `isSaving` honesto. */
  const write = useCallback(
    async <T,>(action: Promise<T>): Promise<T> => {
      setIsSaving(true);
      try {
        const result = await action;
        const [list, planData] = await Promise.all([
          api.get<Debt[]>('/debts'),
          api.get<PayoffPlan>('/debts/plan'),
        ]);
        setDebts(Array.isArray(list) ? list : []);
        setPlan(planData);
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const createDebt = useCallback(
    (input: DebtInput) => write(api.post<Debt>('/debts', input)),
    [write],
  );

  const updateDebt = useCallback(
    (id: number, input: Partial<DebtInput>) =>
      write(api.put<Debt>(`/debts/${id}`, input)),
    [write],
  );

  const deleteDebt = useCallback(
    (id: number) => write(api.delete<unknown>(`/debts/${id}`)),
    [write],
  );

  const payDebt = useCallback(
    (
      id: number,
      input: {
        amount: number;
        financeId?: number;
        accountId?: number;
        ledger?: boolean;
        accrueInterest?: boolean;
      },
    ) =>
      write(
        api.post<{ debt: Debt; payment: DebtPayment }>(
          `/debts/${id}/pay`,
          input,
        ),
      ),
    [write],
  );

  const getPayments = useCallback(
    (id: number) => api.get<DebtPayment[]>(`/debts/${id}/payments`),
    [],
  );

  const undoPayment = useCallback(
    (debtId: number, paymentId: number) =>
      write(api.delete<Debt>(`/debts/${debtId}/payment/${paymentId}`)),
    [write],
  );

  const savePlan = useCallback(
    (input: { strategy?: PayoffStrategy; extraMonthly?: number; currency?: string }) =>
      write(api.put<unknown>('/debts/plan', input)),
    [write],
  );

  const getCandidates = useCallback(
    () => api.get<ImportCandidate[]>('/debts/import/candidates'),
    [],
  );

  const importDebt = useCallback(
    (input: { recurringId?: number; accountId?: number; annualInterestRate?: number }) =>
      write(api.post<Debt>('/debts/import', input)),
    [write],
  );

  return {
    debts,
    plan,
    isLoading,
    isSaving,
    error,
    load,
    loadPlan,
    createDebt,
    updateDebt,
    deleteDebt,
    payDebt,
    getPayments,
    undoPayment,
    savePlan,
    getCandidates,
    importDebt,
    resetError: () => setError(null),
  };
}
