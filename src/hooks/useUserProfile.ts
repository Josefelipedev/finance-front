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
  currency?: string;
  spouseId?: number;
  spouse?: { id: number; name: string; phone?: string } | null;
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
  currency?: string;
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
      const response = await api.get<UserProfile>('/contacts/profile');

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
      const response = await api.patch<UserProfile>('/contacts/update', data);

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
      // Backend: @Controller('contacts') + @Post('couple') → retorna mensagem (string)
      const response = await api.post<string>('/contacts/couple', {
        spousePhone,
      });

      // Recarrega o perfil para refletir isMarried/spouseId atualizados
      await getProfile();

      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getProfile]);

  // ===================== DISSOCIATE COUPLE =====================

  const dissociateCouple = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.delete<string>('/contacts/couple');
      await getProfile();
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getProfile]);

  // ===================== PUBLIC API =====================

  return {
    profile,

    getProfile,
    updateProfile,
    associateAsCouple,
    dissociateCouple,

    // Estado
    isLoading,
    error,

    // Helpers
    resetError: () => setError(null),
    resetProfile: () => setProfile(null),
  };
}
