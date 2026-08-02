import { useEffect, useState } from 'react';
import api from '../services/api';

export interface MonthForecast {
  month: string;
  realized: { income: number; expense: number; balance: number };
  pending: { income: number; expense: number };
  projectedBalance: number;
  displayCurrency: string;
}

/**
 * O que ainda falta acontecer este mês.
 *
 * É **sempre o mês corrente**, não o período escolhido no ecrã: misturar um
 * intervalo qualquer com "o que falta pagar até ao fim do mês" daria um número
 * que não responde a pergunta nenhuma.
 */
export function useForecast() {
  const [data, setData] = useState<MonthForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get<MonthForecast>('/finance/forecast')
      .then((res) => alive && setData(res))
      .catch(() => alive && setData(null))
      .finally(() => alive && setIsLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { forecast: data, isLoading };
}
