import { useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

export interface InsightResponse {
  insight: string;
}

// ===================== HOOK =====================
// Cobre o lado "IA" da análise. Os dados numéricos do relatório mensal
// vêm das transações (useFinance), espelhando o app Android.

export function useAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * O comentário da IA sobre um período.
   *
   * Sem o período, o servidor guardava um insight por utilizador **por dia** e
   * devolvia sempre o mesmo — trocar o mês no ecrã dava um texto sobre números
   * que já não estavam à vista.
   */
  const getInsight = async (period?: { startDate?: string; endDate?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get<InsightResponse>('/analysis/insight', {
        params: { startDate: period?.startDate, endDate: period?.endDate },
      });
      return res?.insight ?? '';
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, getInsight };
}
