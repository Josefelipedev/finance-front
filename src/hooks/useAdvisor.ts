import { useCallback, useState } from 'react';
import api from '../services/api';

/**
 * O assistente que fala sobre o teu dinheiro.
 *
 * A mesma forma do Fiscal — prompt de perito mais os números reais —, mas com
 * dois modos: uma pergunta solta e um plano com fases que fica gravado.
 */

export type AdvisorDomainKey = 'debts' | 'budget' | 'meals' | 'bills';

export interface AdvisorDomain {
  key: AdvisorDomainKey;
  label: string;
  description: string;
}

export interface AdvisorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AdvisorAnswer {
  answer: string;
  /** Os números que foram dados ao modelo. Serve para se poder desconfiar. */
  context: string;
}

export interface AdvisorPlanSummary {
  id: number;
  domain: AdvisorDomainKey;
  question: string | null;
  createdAt: string;
}

export interface AdvisorPlan extends AdvisorPlanSummary {
  content: string;
  /** Os números de que o plano partiu — sem eles não se consegue julgá-lo. */
  context: string | null;
}

export function useAdvisor() {
  const [isAsking, setIsAsking] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);

  const getDomains = useCallback(
    () => api.get<AdvisorDomain[]>('/advisor/domains'),
    [],
  );

  const ask = useCallback(
    async (
      domain: AdvisorDomainKey,
      question: string,
      history?: AdvisorMessage[],
    ) => {
      setIsAsking(true);
      try {
        return await api.post<AdvisorAnswer>(`/advisor/${domain}/ask`, {
          question,
          history,
        });
      } finally {
        setIsAsking(false);
      }
    },
    [],
  );

  const makePlan = useCallback(
    async (domain: AdvisorDomainKey, question?: string) => {
      setIsPlanning(true);
      try {
        return await api.post<AdvisorPlan>(`/advisor/${domain}/plan`, {
          question,
        });
      } finally {
        setIsPlanning(false);
      }
    },
    [],
  );

  const listPlans = useCallback(
    (domain?: AdvisorDomainKey) =>
      api.get<AdvisorPlanSummary[]>(
        domain ? `/advisor/plans?domain=${domain}` : '/advisor/plans',
      ),
    [],
  );

  const getPlan = useCallback(
    (id: number) => api.get<AdvisorPlan>(`/advisor/plans/${id}`),
    [],
  );

  const deletePlan = useCallback(
    (id: number) => api.delete<{ deleted: boolean }>(`/advisor/plans/${id}`),
    [],
  );

  return {
    getDomains,
    ask,
    makePlan,
    listPlans,
    getPlan,
    deletePlan,
    isAsking,
    isPlanning,
  };
}
