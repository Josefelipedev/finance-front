import { useCallback, useState } from 'react';
import api from '../services/api';

// ===== Tipos da resposta de GET /fiscal/obligations =====
export interface FiscalProfile {
  regime: string;
  regimeLabel: string;
  ivaStatus: string;
  ivaLabel: string;
  activityStartDate: string; // "YYYY-MM-DD"
  fiscalNumber?: string | null;
  thresholdEur: number; // 15000
  currency: string;
}

export interface FiscalStatus {
  socialSecurityFirstYearExempt: boolean;
  socialSecurityExemptUntil: string; // "YYYY-MM-DD"
}

export interface FiscalObligation {
  key: string;
  title: string;
  description: string;
  frequency: string; // "Mensal · até dia 5"
  meta?: string;
}

export type FiscalTag = 'mensal' | 'anual' | 'ss' | 'limite';

export interface FiscalUpcoming {
  date: string; // "YYYY-MM-DD"
  endDate?: string;
  title: string;
  description: string;
  tag: FiscalTag;
  daysUntil: number;
}

export interface FiscalDataConfigured {
  configured: true;
  country: string;
  profile: FiscalProfile;
  status: FiscalStatus;
  obligations: FiscalObligation[];
  upcoming: FiscalUpcoming[];
  nextDeadline: FiscalUpcoming | null;
  disclaimer: string;
}

export interface FiscalDataNotConfigured {
  configured: false;
}

export type FiscalData = FiscalDataConfigured | FiscalDataNotConfigured;

/**
 * Obrigações fiscais do utilizador (GET /fiscal/obligations).
 * A ESCRITA do perfil fiscal é feita via useUserProfile().updateProfile.
 */
export function useFiscal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getObligations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.get<FiscalData>('/fiscal/obligations');
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getObligations, isLoading, error };
}
