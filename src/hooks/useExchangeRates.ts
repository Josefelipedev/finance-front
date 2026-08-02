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
/**
 * `loading` enquanto a resposta não chega, `failed` quando desistiu.
 *
 * A diferença importa: quem só via `null` tratava "ainda não chegaram" como
 * "não há taxas" e mostrava, no primeiro instante do ecrã, um erro a dizer
 * que não dava para somar moedas — que desaparecia sozinho a seguir. Um aviso
 * que aparece e some sem nada ter mudado ensina a ignorar os avisos.
 */
export type ExchangeRatesState = {
  rates: ExchangeRates | null;
  status: 'loading' | 'ready' | 'failed';
};

export function useExchangeRatesState(): ExchangeRatesState {
  const [state, setState] = useState<ExchangeRatesState>({
    rates: null,
    status: 'loading',
  });
  const setRates = (r: ExchangeRates | null) =>
    setState(r ? { rates: r, status: 'ready' } : { rates: null, status: 'failed' });

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

  return state;
}

/** Só as taxas, para quem não precisa de distinguir "a carregar" de "falhou". */
export function useExchangeRates(): ExchangeRates | null {
  return useExchangeRatesState().rates;
}
