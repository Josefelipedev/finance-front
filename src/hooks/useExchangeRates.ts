import { useEffect, useState } from 'react';
import api from '../services/api';
import type { ExchangeRates } from '../utils/currency';

interface RatesResponse {
  base: string;
  date: string | null;
  rates: ExchangeRates;
}

/**
 * Taxas de câmbio (base EUR) de GET /currency/rates, para converter valores
 * por item antes de agregar em telas multi-moeda (casal BRL+EUR).
 * Retorna null até carregar (os consumidores tratam como "sem conversão").
 */
export function useExchangeRates(): ExchangeRates | null {
  const [rates, setRates] = useState<ExchangeRates | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get<RatesResponse>('/currency/rates')
      .then((res) => {
        if (alive) setRates(res?.rates ?? null);
      })
      .catch(() => {
        if (alive) setRates(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  return rates;
}
