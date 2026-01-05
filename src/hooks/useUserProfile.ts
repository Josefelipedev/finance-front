import { useState, useCallback } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

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
}

// ===================== HOOK =====================

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ===================== GET PROFILE =====================

  const getProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<UserProfile>('/user/profile');

      if (response) {
        setProfile(response);
        return response;
      }

      throw new Error('Perfil inválido');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===================== UPDATE PROFILE =====================

  const updateProfile = useCallback(async (data: UpdateUserProfileDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.put<UserProfile>('/user/update', data);

      if (response) {
        setProfile(response);
        return response;
      }

      throw new Error('Falha ao atualizar perfil');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===================== ASSOCIATE COUPLE =====================

  const associateAsCouple = useCallback(async (spousePhone: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<boolean>('/user/associate-couple', {
        spousePhone,
      });

      if (response !== false) {
        return response;
      }

      throw new Error('Falha ao associar casal');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===================== PUBLIC API =====================

  return {
    profile,

    getProfile,
    updateProfile,
    associateAsCouple,

    // Estado
    isLoading,
    error,

    // Helpers
    resetError: () => setError(null),
    resetProfile: () => setProfile(null),
  };
}
