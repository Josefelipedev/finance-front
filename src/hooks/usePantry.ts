import { useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

export interface PantryItem {
  id: number;
  userId: number;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null;
  expiresAt?: string | null;
  addedAt?: string;
  updatedAt?: string;
}

export interface UpsertPantryDto {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  expiresAt?: string; // ISO date string
}

// ===================== HOOK =====================

export function usePantry() {
  const [data, setData] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getAll = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await api.get<PantryItem[]>('/pantry');

      if (!Array.isArray(items)) {
        throw new Error('Resposta inválida da despensa');
      }

      setData(items);
      return items;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const upsert = async (payload: UpsertPantryDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const item = await api.post<PantryItem>('/pantry', payload);

      if (!item) {
        throw new Error('Item inválido');
      }

      // upsert: substitui se já existe (mesmo id), senão adiciona
      setData((prev) => {
        const exists = prev.some((i) => i.id === item.id);
        return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item];
      });
      return item;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (id: number, payload: UpsertPantryDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const item = await api.patch<PantryItem>(`/pantry/${id}`, payload);

      if (!item) {
        throw new Error('Falha ao atualizar item');
      }

      setData((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      return item;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<boolean>(`/pantry/${id}`);
      setData((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clear = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<boolean>('/pantry');
      setData([]);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, getAll, upsert, update, remove, clear };
}
