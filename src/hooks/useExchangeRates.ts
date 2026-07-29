import { useEffect, useState } from 'react';
import api from '../services/api';
import type { ExchangeRates } from '../utils/currency';

interface RatesResponse {
  base: string;
  date: string | null;
  rates: ExchangeRates;
}

/** Espaçamento entre tentativas, em ms. */
const RETRY_DELAYS = [800, 2500];

/**
 * Taxas de câmbio (base EUR) de GET /currency/rates, para converter valores
 * por item antes de agregar em telas multi-moeda (casal BRL+EUR).
 * Retorna null enquanto carrega — e também se falhar.
 *
 * ⚠️ Quem agrega valores de moedas diferentes NÃO pode tratar `null` como
 * "sem conversão necessária": soma os reais com os euros e mostra um total
 * 5,8× maior. Chame `unconvertibleCurrencies()` antes de somar e mostre o
 * aviso em vez do número.
 *
 * Tenta de novo em caso de falha: antes era uma única busca ao montar, e uma
 * falha de rede nesse instante estragava os números até recarregar a página.
 */
export function useExchangeRates(): ExchangeRates | null {
  const [rates, setRates] = useState<ExchangeRates | null>(null);

  useEffect(() => {
    const signal = { alive: true };

    const load = async () => {
      for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        try {
          const res = await api.get<RatesResponse>('/currency/rates');
          if (!signal.alive) return;
          if (res?.rates) {
            setRates(res.rates);
            return;
          }
        } catch {
          // cai para a tentativa seguinte
        }
        if (!signal.alive) return;
        const delay = RETRY_DELAYS[attempt];
        if (delay) await new Promise((r) => setTimeout(r, delay));
      }
      if (signal.alive) setRates(null);
    };

    void load();
    return () => {
      signal.alive = false;
    };
  }, []);

  return rates;
}
