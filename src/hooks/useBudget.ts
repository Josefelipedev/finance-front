import { useCallback, useEffect, useState } from 'react';

// ===================== TYPES =====================
// Paridade com o Android: os limites de orçamento são armazenados
// localmente no dispositivo (Room). No web, o equivalente fiel é o
// localStorage. O "gasto" vem das transações da API (useFinance).

export interface BudgetLimit {
  categoryId: number;
  categoryName: string;
  monthlyLimit: number;
  alertAt: number; // percentual (default 80)
}

const STORAGE_KEY = 'finploit:budget-limits';

function readStorage(): BudgetLimit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(limits: BudgetLimit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limits));
}

// ===================== HOOK =====================

export function useBudget() {
  const [limits, setLimits] = useState<BudgetLimit[]>([]);

  useEffect(() => {
    setLimits(readStorage());
  }, []);

  const persist = useCallback((next: BudgetLimit[]) => {
    setLimits(next);
    writeStorage(next);
  }, []);

  // upsert por categoryId (PrimaryKey, igual ao Room)
  const upsert = useCallback(
    (limit: BudgetLimit) => {
      const next = (() => {
        const exists = limits.some((l) => l.categoryId === limit.categoryId);
        return exists
          ? limits.map((l) => (l.categoryId === limit.categoryId ? limit : l))
          : [...limits, limit];
      })();
      persist(next);
    },
    [limits, persist]
  );

  const remove = useCallback(
    (categoryId: number) => {
      persist(limits.filter((l) => l.categoryId !== categoryId));
    },
    [limits, persist]
  );

  return { limits, upsert, remove };
}
