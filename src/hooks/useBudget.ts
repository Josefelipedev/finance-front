import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================
// Os limites vivem no SERVIDOR (C1 da revisão). Viviam no `localStorage` do
// browser e, no Android, numa base Room local: dois conjuntos que divergiam em
// silêncio, que não sobreviviam a trocar de browser nem de telemóvel, e que o
// casal nunca via igual.
//
// **O gasto passou a vir do servidor (F2).** Era somado aqui no browser, a
// partir de todas as transações do mês — e o Android somava as suas, e o plano
// de dívidas fazia uma terceira. Três somas para a mesma pergunta é três sítios
// onde divergir; e a janela do mês era construída com a meia-noite do fuso do
// BROWSER, o que a oeste de Greenwich deixava as despesas do dia 1 de fora.

export interface BudgetLimit {
  categoryId: number;
  categoryName: string;
  /** Já convertido pelo servidor para a moeda de quem está a ler (C4). */
  monthlyLimit: number;
  alertAt: number; // percentual (default 80)
  /** Moeda em que os valores acima vêm — a de quem lê. */
  currency?: string;
  /** O que foi mesmo escrito, na moeda em que foi escrito. */
  originalMonthlyLimit?: number;
  originalCurrency?: string;
  /**
   * O que já saiu nesta categoria no mês civil corrente, somado NO SERVIDOR à
   * taxa do dia de cada lançamento.
   */
  spent?: number;
  /** Moedas sem taxa: o gasto é aproximado e o ecrã tem de o dizer (T7). */
  unconvertedCurrencies?: string[];
  /**
   * Quem escreveu este tecto: `manual` (alguém aqui) ou `food_budget` (nasceu
   * da meta de alimentação). Um tecto da meta não se edita aqui — o servidor
   * recusa, para a meta e o tecto não passarem a dizer coisas diferentes.
   */
  source?: 'manual' | 'food_budget' | string;
}

/** Quanto se gastou em comida este mês, pela definição da app. */
export interface FoodSpend {
  spent: number;
  currency: string;
  unconvertedCurrencies: string[];
  rateDate: string | null;
}

/** Chave da migração única do que estava guardado no browser. */
const STORAGE_KEY = 'finploit:budget-limits';

// ===================== HOOK =====================

export function useBudget() {
  const [limits, setLimits] = useState<BudgetLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<BudgetLimit[]>('/budget');
      setLimits(Array.isArray(data) ? data : []);
      setError(null);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sobe uma vez o que estava no browser, para quem já tinha limites definidos
   * não os ver desaparecer no dia em que isto passou para o servidor. Corre
   * só quando o servidor ainda não tem nada, e apaga a chave a seguir.
   */
  const migrateLocal = useCallback(async (existing: BudgetLimit[]) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    if (existing.length > 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      for (const limit of parsed) {
        if (typeof limit?.categoryId !== 'number') continue;
        await api.put(`/budget/${limit.categoryId}`, {
          monthlyLimit: Number(limit.monthlyLimit) || 0,
          alertAt: Number(limit.alertAt) || 80,
        });
      }
    } catch {
      // Um localStorage corrompido não pode impedir o ecrã de abrir.
    } finally {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const existing = await load();
      await migrateLocal(existing);
      if (localStorage.getItem(STORAGE_KEY) === null && existing.length === 0) {
        await load();
      }
    })().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upsert = useCallback(
    async (limit: BudgetLimit) => {
      await api.put(`/budget/${limit.categoryId}`, {
        monthlyLimit: limit.monthlyLimit,
        alertAt: limit.alertAt,
      });
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (categoryId: number) => {
      await api.delete(`/budget/${categoryId}`);
      await load();
    },
    [load]
  );

  /**
   * O gasto em comida não é a soma de uma categoria: uma lista de compras
   * fechada é comida venha na categoria que vier, e uma despesa de supermercado
   * lançada como conta a pagar continua a ser comida.
   */
  const getFoodSpend = useCallback(() => api.get<FoodSpend>('/budget/food'), []);

  return { limits, upsert, remove, isLoading, error, reload: load, getFoodSpend };
}
