import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================
// Os limites vivem no SERVIDOR (C1 da revisão). Viviam no `localStorage` do
// browser e, no Android, numa base Room local: dois conjuntos que divergiam em
// silêncio, que não sobreviviam a trocar de browser nem de telemóvel, e que o
// casal nunca via igual. O gasto continua a vir das transações (useFinance).

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

  return { limits, upsert, remove, isLoading, error, reload: load };
}
