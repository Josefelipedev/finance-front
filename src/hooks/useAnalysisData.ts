import { useEffect, useState } from 'react';
import api from '../services/api';

/** Um balde de tempo: rótulos + [ganhos, despesas] + somatórios. */
export interface TimeSeries {
  labels: string[];
  datasets: { data: number[] }[];
  summary: { income: number; expense: number };
}

/** A parte de cada pessoa numa categoria (C6). */
export interface CategoryOwnerSplit {
  userId: number;
  name: string | null;
  income: number;
  expense: number;
}

export interface CategorySummaryItem {
  category: string;
  icon: string | null;
  income: number;
  expense: number;
  /** De quem é este número. Uma entrada só = não há com quem repartir. */
  byOwner?: CategoryOwnerSplit[];
}

export interface AnalysisResponse {
  Daily: TimeSeries;
  Weekly: TimeSeries;
  Monthly: TimeSeries;
  Year: TimeSeries;
  categorySummary: CategorySummaryItem[];
  displayCurrency: string;
  rateDate: string | null;
  unconvertedCurrencies: string[];
  /** Alguma conversão usou a taxa mais antiga que há — o total é aproximado. */
  outOfRangeDates?: boolean;
}

/**
 * As somas da Análise, feitas no servidor.
 *
 * Os três gráficos deste ecrã pediam a lista de transações **cada um por si** e
 * voltavam a somar tudo no cliente — agrupar por dia, por mês, por categoria,
 * converter moeda. O servidor já fazia essas contas para o Android, testadas
 * (`analysis/aggregate.ts`), escopadas ao casal e com a conversão feita antes
 * de somar. Ter duas implementações da mesma coisa é ter duas oportunidades de
 * elas discordarem — e foi assim que a Análise passou meses a dar números que
 * não batiam com o resto da app.
 *
 * Um pedido para os três gráficos, em vez de três.
 */
export function useAnalysis(dateRange: { startDate: string; endDate: string }) {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    setError(null);

    api
      .get<AnalysisResponse>('/analysis', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      })
      .then((res) => {
        if (!alive) return;
        setData(res);
      })
      .catch((err: Error) => {
        if (!alive) return;
        setError(err.message || 'Não foi possível carregar a análise.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  return { data, isLoading, error };
}
