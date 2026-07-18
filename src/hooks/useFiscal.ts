import { useCallback, useState } from 'react';
import api from '../services/api';

// ===== Tipos da resposta de GET /fiscal/obligations =====
export interface FiscalProfile {
  regime: string;
  regimeLabel: string;
  accountingRegime: 'simplified' | 'organized';
  ivaStatus: 'exempt_art53' | 'exempt_art9' | 'normal_quarterly' | 'normal_monthly';
  ivaLabel: string;
  withholdingMode: 'exempt_art101b' | 'withholding' | 'not_applicable';
  withholdingLabel: string;
  socialSecurityStatus: string;
  socialSecurityLabel: string;
  activityStartDate: string; // "YYYY-MM-DD"
  activityCode?: string | null;
  fiscalNumber?: string | null;
  annualRevenue: number;
  thresholdEur: number; // 15000
  immediateExitThresholdEur: number; // 18750
  currency: string;
  hasEuB2bClients: boolean;
  hasNonEuClients: boolean;
  hasPaymentsOnAccount: boolean;
  hasWorkAccidentInsurance: boolean;
  usesPortalInvoices: boolean;
  hasEmployees: boolean;
}

export interface FiscalStatus {
  socialSecurityFirstYearExempt: boolean;
  socialSecurityExemptUntil: string | null;
  socialSecurityContributing: boolean;
  revenueProgressPercent: number;
  profileCompleteness: number;
}

export interface FiscalObligation {
  key: string;
  title: string;
  description: string;
  frequency: string; // "Mensal · até dia 5"
  category: 'setup' | 'invoice' | 'vat' | 'irs' | 'ss' | 'cross_border' | 'accounting';
  meta?: string;
  sourceUrl?: string;
  conditional?: boolean;
}

export type FiscalTag = 'faturas' | 'iva' | 'irs' | 'ss' | 'estrangeiro' | 'contabilidade';

export interface FiscalUpcoming {
  date: string; // "YYYY-MM-DD"
  endDate?: string;
  title: string;
  description: string;
  tag: FiscalTag;
  daysUntil: number;
  sourceUrl?: string;
}

export interface FiscalWarning {
  key: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  sourceUrl?: string;
}

export interface FiscalDataConfigured {
  configured: true;
  country: string;
  profile: FiscalProfile;
  status: FiscalStatus;
  warnings: FiscalWarning[];
  obligations: FiscalObligation[];
  upcoming: FiscalUpcoming[];
  nextDeadline: FiscalUpcoming | null;
  sources: { title: string; url: string }[];
  disclaimer: string;
}

export interface FiscalDataNotConfigured {
  configured: false;
  country?: string;
}

export type FiscalData = FiscalDataConfigured | FiscalDataNotConfigured;

// ===== Assistente Fiscal (POST /fiscal/ask) =====
export interface FiscalChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FiscalAskResponse {
  answer: string;
}

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

  const askFiscal = useCallback(async (question: string, history?: FiscalChatMessage[]) => {
    setError(null);
    try {
      return await api.post<FiscalAskResponse>('/fiscal/ask', {
        question,
        history,
      });
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    }
  }, []);

  return { getObligations, askFiscal, isLoading, error };
}
