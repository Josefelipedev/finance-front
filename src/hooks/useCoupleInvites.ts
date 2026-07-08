import { useCallback, useState } from 'react';
import api from '../services/api';

export interface CoupleInviteParty {
  id: number;
  name: string;
  displayName?: string | null;
  phone?: string | null;
}

export interface CoupleInvite {
  id: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  inviter: CoupleInviteParty;
  invitee: CoupleInviteParty;
}

export interface CoupleInvites {
  sent: CoupleInvite[];
  received: CoupleInvite[];
}

export function useCoupleInvites() {
  const [invites, setInvites] = useState<CoupleInvites>({ sent: [], received: [] });
  const [isLoading, setIsLoading] = useState(false);

  const loadInvites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<CoupleInvites>('/contacts/couple/invites');
      setInvites(data ?? { sent: [], received: [] });
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInvite = useCallback(async (spousePhone: string) => {
    const data = await api.post<{ invite: CoupleInvite | null; message: string }>(
      '/contacts/couple/invites',
      { spousePhone }
    );
    return data;
  }, []);

  const acceptInvite = useCallback(async (id: number) => {
    return api.post<string>(`/contacts/couple/invites/${id}/accept`, {});
  }, []);

  const rejectInvite = useCallback(async (id: number) => {
    return api.post<string>(`/contacts/couple/invites/${id}/reject`, {});
  }, []);

  const cancelInvite = useCallback(async (id: number) => {
    return api.delete<string>(`/contacts/couple/invites/${id}`);
  }, []);

  return { invites, isLoading, loadInvites, createInvite, acceptInvite, rejectInvite, cancelInvite };
}
