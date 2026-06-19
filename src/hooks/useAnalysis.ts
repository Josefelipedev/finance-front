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

  const getInsight = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get<InsightResponse>('/analysis/insight');
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
