// src/hooks/useUserProfile.ts
import { useApi } from './useApi';
import { useState, useCallback } from 'react';

export interface UserProfile {
  id: number;
  name: string;
  email?: string;
  phone: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profilePicUrl?: string;
  whatsapp?: string;
  isChatBot?: boolean;
  isGroup?: boolean;
  isMarried?: boolean;
  spouseId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  whatsapp?: string;
  // Adicione outros campos conforme necessário
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const api = useApi<UserProfile>('finance'); // basePath é 'user'

  const getProfile = useCallback(async () => {
    try {
      const response = await api.get('/user/profile');
      console.log(response);
      if (response) {
        setProfile(response);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateUserProfileDto) => {
    try {
      const response = await api.patch('/update', data);
      if (response) {
        setProfile(response);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Função para associar como casal (se necessário)
  const associateAsCouple = useCallback(async (spousePhone: string) => {
    try {
      const response = await api.post('/associate-couple', { spousePhone });
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    profile,
    getProfile,
    updateProfile,
    associateAsCouple,
    error: api.error,
    isLoading: api.isLoading,
    isSuccess: api.isSuccess,
    isError: api.isError,
    reset: api.reset,
  };
}
