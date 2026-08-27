import { useCallback, useState } from 'react';
import api from '../services/api';

// ===================== DTOs =====================

export interface CreateFinanceDto {
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  categoryId?: number;
  iconName?: string;
  referenceDate?: string;
  currency?: string;
  accountId?: number;
}

export interface FinanceRecord {
  id: number;
  /** O valor como foi lançado, na moeda dele. Serve para MOSTRAR a linha. */
  amount: number;
  /**
   * O mesmo valor na moeda de exibição, convertido pelo servidor **à taxa do
   * dia do lançamento**. É o único que se pode somar.
   *
   * O cliente não converte nada: fazia-o com a taxa de hoje, e por isso o total
   * de um mês fechado mudava sozinho todos os dias (julho/2026 valeu entre
   * 898,02 € e 925,19 € sem ninguém lançar nada).
   */
  convertedAmount?: number;
  type: 'income' | 'expense';
  currency?: string;
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
  /** Conta a pagar/receber que este lançamento quita (null = lançamento solto). */
  billOccurrenceId?: number | null;
  bill?: LinkedBill | null;
  /** De onde veio este lançamento — `null` quando foi escrito à mão. */
  origin?: FinanceOrigin | null;
}

/**
 * A origem de um lançamento que a app criou sozinha.
 *
 * Cinco módulos emitem lançamentos e na lista eram todos linhas iguais — não
 * havia como ver que a mesma compra tinha sido contada duas vezes, uma pela
 * lista fechada e outra à mão.
 */
export interface FinanceOrigin {
  kind: 'bill' | 'goal' | 'shopping' | 'meal';
  label: string;
  refId: number;
}

/**
 * A conta que um lançamento quita. Vem resolvida do servidor porque o vínculo
 * é por id solto (sem relação no schema) e o cliente não tem por onde a ir
 * buscar sozinho.
 */
export interface LinkedBill {
  id: number;
  description: string;
  dueDate: string;
  status: string;
  recurringId: number | null;
}

/**
 * O que o servidor diz sobre a conversão de uma listagem.
 *
 * `unconvertedCurrencies` é a lista das moedas que ele NÃO conseguiu converter
 * (AOA e MZN não são cobertas pelo BCE): com algo aqui, os `convertedAmount`
 * dessas linhas vêm pelo valor nativo e somá-los daria reais valendo euros.
 * Quem mostra um total tem de o recusar e mostrar `<MixedCurrencyWarning>`.
 */
export interface FinanceListMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  displayCurrency?: string;
  /** Data da taxa aplicada — com a regra da data, a mais recente das aplicadas. */
  rateDate?: string | null;
  unconvertedCurrencies?: string[];
  /** Alguma conversão usou a taxa mais antiga que temos. */
  outOfRangeDates?: boolean;
}

interface FinanceListResponse {
  data: FinanceRecord[];
  meta?: FinanceListMeta;
}

export interface CurrencyBreakdown {
  currency: string;
  ganhos: number;
  despesas: number;
}

export interface FinanceSummary {
  totalGanhos: number;
  totalDespesas: number;
  saldo: number;
  /** Moeda de exibição do usuário — os totais acima já vêm convertidos para ela */
  displayCurrency?: string;
  /** Data da taxa de câmbio usada na conversão (null = sem conversão necessária) */
  rateDate?: string | null;
  /** Somas nativas por moeda, sem conversão */
  byCurrency?: CurrencyBreakdown[];
  unconvertedCurrencies?: string[];
  /** Alguma conversão usou a taxa mais antiga que temos. */
  outOfRangeDates?: boolean;
}

export interface DashboardData {
  totalBalance: number;
  totalExpense: number;
  displayCurrency?: string;
  rateDate?: string | null;
  /** Moedas que o servidor não converteu — os totais acima são aproximados. */
  unconvertedCurrencies?: string[];
  /** Alguma conversão usou a taxa mais antiga que temos. */
  outOfRangeDates?: boolean;
  byCurrency?: CurrencyBreakdown[];
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
    currency?: string;
  }>;
}

export interface QueryParams {
  startDate?: string;
  endDate?: string;
}

// ===================== HOOK =====================

export const useFinance = () => {
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [listMeta, setListMeta] = useState<FinanceListMeta | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [summaryData, setSummaryData] = useState<FinanceSummary | null>(null);

  const isLoading = loadingCount > 0;

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoadingCount((c) => c + 1);
    try {
      return await fn();
    } finally {
      setLoadingCount((c) => Math.max(0, c - 1));
    }
  }, []);

  // ===================== CREATE =====================

  const addFinanceRecord = useCallback(async (data: CreateFinanceDto) => {
    setError(null);
    return withLoading(async () => {
      try {
        const record = await api.post<FinanceRecord>('/finance', data);
        if (record) {
          setRecords((prev) => [record, ...prev]);
          return record;
        }
        throw new Error('Registro financeiro inválido');
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  // ===================== READ =====================

  /**
   * TODAS as transações do período — as páginas todas, não a primeira.
   *
   * Isto pedia `/finance` sem `limit`, e o servidor assume **50**
   * (`finance.controller.ts`). Quem consome esta lista soma-a: gráfico de
   * tendência, comparação mensal, relatório mensal, calendário e distribuição
   * por categoria. Num mês com mais de 50 lançamentos, esses cinco passavam a
   * mostrar **menos dinheiro do que existe**, enquanto os cartões do Dashboard
   * — somados no servidor — mostravam o total certo. O mesmo ecrã a
   * contradizer-se, sem aviso, com o número mais baixo a parecer o inofensivo.
   *
   * O `meta.totalPages` já vinha na resposta e era ignorado; agora percorre-se
   * até ao fim, com o limite máximo que o servidor aceita (200) para fazer o
   * menor número de pedidos possível.
   */
  const getAllFinances = useCallback(async (params?: QueryParams) => {
    setError(null);
    return withLoading(async () => {
      try {
        const PAGE_SIZE = 200; // o teto do servidor
        const MAX_PAGES = 50; // 10 000 lançamentos: rede contra um engano
        const todos: FinanceRecord[] = [];
        let page = 1;
        let totalPages = 1;

        do {
          const res = await api.get<FinanceRecord[] | FinanceListResponse>('/finance', {
            params: {
              startDate: params?.startDate,
              endDate: params?.endDate,
              page,
              limit: PAGE_SIZE,
            },
          });

          // O endpoint é paginado e retorna { data, meta }; aceita também array cru.
          const list = Array.isArray(res) ? res : res?.data;
          if (!Array.isArray(list)) throw new Error('Lista de finanças inválida');
          todos.push(...list);

          // A moeda de exibição e o que o servidor NÃO conseguiu converter. Quem
          // soma tem de olhar para isto antes de mostrar um total — ver
          // `MixedCurrencyWarning`.
          if (!Array.isArray(res) && res?.meta) setListMeta(res.meta);

          totalPages = Array.isArray(res) ? 1 : (res?.meta?.totalPages ?? 1);
          page += 1;
        } while (page <= totalPages && page <= MAX_PAGES);

        setRecords(todos);
        return todos;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  const getFinanceSummary = useCallback(async (params?: QueryParams) => {
    setError(null);
    return withLoading(async () => {
      try {
        const summary = await api.get<FinanceSummary>('/finance/summary', {
          params: {
            startDate: params?.startDate,
            endDate: params?.endDate,
          },
        });
        if (summary) {
          setSummaryData(summary);
          return summary;
        }
        throw new Error('Resumo financeiro inválido');
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  const getDashboardData = useCallback(async (params?: QueryParams) => {
    setError(null);
    return withLoading(async () => {
      try {
        const dashboard = await api.get<DashboardData>('/finance/dashboard', {
          params: {
            startDate: params?.startDate,
            endDate: params?.endDate,
          },
        });
        if (dashboard) {
          setDashboardData(dashboard);
          return dashboard;
        }
        throw new Error('Dashboard inválido');
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  // ===================== UPDATE =====================

  const updateFinanceRecord = useCallback(async (id: number, data: Partial<CreateFinanceDto>) => {
    setError(null);
    return withLoading(async () => {
      try {
        const updated = await api.patch<FinanceRecord>(`/finance/${id}`, data);
        if (updated) {
          setRecords((prev) => prev.map((record) => (record.id === id ? updated : record)));
          return updated;
        }
        throw new Error('Falha ao atualizar registro');
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  // ===================== DELETE =====================

  const deleteFinanceRecord = useCallback(async (id: number) => {
    setError(null);
    return withLoading(async () => {
      try {
        // A API lança erro em caso de falha (cai no catch); se resolveu, removeu.
        await api.delete(`/finance/${id}`);
        setRecords((prev) => prev.filter((record) => record.id !== id));
        // Atualização funcional: mantém a função estável (sem depender de dashboardData)
        setDashboardData((prev) =>
          prev
            ? {
                ...prev,
                transactions: prev.transactions.filter((tx) => tx.id !== id.toString()),
              }
            : prev,
        );
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    });
  }, [withLoading]);

  // ===================== REFRESH =====================

  const refreshAllData = useCallback(async (params?: QueryParams) => {
    try {
      await Promise.all([
        getAllFinances(params),
        getDashboardData(params),
        getFinanceSummary(params),
      ]);
    } catch (err) {
      console.error('Erro ao atualizar dados financeiros:', err);
      throw err;
    }
  }, [getAllFinances, getDashboardData, getFinanceSummary]);

  // ===================== PUBLIC API =====================

  return {
    // CRUD principal
    addFinanceRecord,
    getAllFinances,
    getFinanceSummary,
    getDashboardData,
    updateFinanceRecord,
    deleteFinanceRecord,
    refreshAllData,

    // Aliases
    addRecord: addFinanceRecord,
    getRecords: getAllFinances,
    updateRecord: updateFinanceRecord,
    deleteRecord: deleteFinanceRecord,

    // Estado
    records,
    listMeta,
    dashboardData,
    summaryData,
    isLoading,
    error,

    // Helpers
    resetError: () => setError(null),
    resetData: () => {
      setRecords([]);
      setDashboardData(null);
      setSummaryData(null);
    },
  };
};
