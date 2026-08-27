import { useCallback, useState } from 'react';
import api from '../services/api';

export interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  agency?: string | null;
  currency: string;
  /**
   * Saldo INICIAL — o ponto de partida escrito à mão (C5). O que se mostra é o
   * `currentBalance`; este campo sozinho nunca acompanhou movimento nenhum.
   */
  balance: number;
  /** O mesmo que `balance`, com o nome que diz o que é. */
  initialBalance?: number;
  /** Ponto de partida + o que entrou − o que saiu, calculado no servidor. */
  currentBalance?: number;
  /** Limite informado pelo utilizador. Nunca participa do saldo. */
  creditLimit?: number | null;
  /** Quanto do limite já está em dívida. */
  creditUsed?: number | null;
  /** `creditLimit − creditUsed`, quando os dois se sabem. */
  creditAvailable?: number | null;
  /** O que os lançamentos ligados a esta conta somam. */
  movements?: { income: number; expense: number; count: number };
  iconName?: string | null;
  userId: number;
  user?: { id: number; name: string };
  createdAt: string;
}

export interface CreateBankAccountDto {
  bankName: string;
  accountNumber?: string;
  agency?: string;
  currency?: string;
  balance?: number;
  creditLimit?: number | null;
  /** Quanto do limite já está em dívida. */
  creditUsed?: number | null;
  /** `creditLimit − creditUsed`, quando os dois se sabem. */
  creditAvailable?: number | null;
}

export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<BankAccount[]>('/bank-accounts');
      setAccounts(data ?? []);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAccount = useCallback(async (dto: CreateBankAccountDto) => {
    return api.post<BankAccount>('/bank-accounts', dto);
  }, []);

  const updateAccount = useCallback(
    async (id: number, dto: Partial<CreateBankAccountDto>) => {
      return api.patch<BankAccount>(`/bank-accounts/${id}`, dto);
    },
    []
  );

  const archiveAccount = useCallback(async (id: number) => {
    return api.delete<string>(`/bank-accounts/${id}`);
  }, []);

  return { accounts, isLoading, loadAccounts, createAccount, updateAccount, archiveAccount };
}
