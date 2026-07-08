import { useCallback, useState } from 'react';
import api from '../services/api';

export interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  agency?: string | null;
  currency: string;
  balance: number;
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
