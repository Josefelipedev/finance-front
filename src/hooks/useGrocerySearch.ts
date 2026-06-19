import { useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

export interface GroceryProduct {
  source: string;
  url: string;
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  currency: string;
  unit_price?: number;
  unit?: string;
  quantity?: number;
  image_url?: string;
  availability: string;
  fetched_at: string;
}

export interface GrocerySearchResponse {
  query: string;
  products: GroceryProduct[];
  cached: boolean;
  total: number;
}

export interface SearchParams {
  query: string;
  supermarkets?: string[];
  postalCode?: string;
}

// Cadeias suportadas pelo scraper (Portugal)
export const GROCERY_CHAINS: { id: string; label: string; emoji: string }[] = [
  { id: 'continente', label: 'Continente', emoji: '🔴' },
  { id: 'auchan', label: 'Auchan', emoji: '🟢' },
  { id: 'mercadona', label: 'Mercadona', emoji: '🟡' },
  { id: 'pingodoce', label: 'Pingo Doce', emoji: '🟩' },
];

// ===================== HOOK =====================

export function useGrocerySearch() {
  const [data, setData] = useState<GrocerySearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = async ({ query, supermarkets, postalCode }: SearchParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = { q: query };
      if (supermarkets && supermarkets.length > 0) {
        params.supermarkets = supermarkets.join(',');
      }
      if (postalCode) {
        params.postalCode = postalCode;
      }

      const result = await api.get<GrocerySearchResponse>('/grocery-search/search', { params });

      if (!result || !Array.isArray(result.products)) {
        throw new Error('Resposta inválida da busca');
      }

      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { data, isLoading, error, search, reset };
}
