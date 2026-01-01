// src/hooks/useDefaultIcons.ts
import { useState, useEffect } from 'react';
import api from '../services/api.ts';

export interface IconOption {
  value: string;
  label: string;
  color: string;
  keywords: string[];
  group: 'income' | 'expense' | 'general';
}

export const useDefaultIcons = () => {
  const [icons, setIcons] = useState<IconOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega ícones da API
  useEffect(() => {
    const loadIcons = async () => {
      try {
        // Tenta carregar da API
        const response = await api.get('/finance-category/icons');
        if (response.ok) {
          const data = await response.json();
          setIcons(data);
        } else {
          // Fallback para ícones locais
          setIcons(getDefaultIcons());
        }
      } catch (error) {
        // Fallback para ícones locais
        setIcons(getDefaultIcons());
      } finally {
        setLoading(false);
      }
    };

    loadIcons();
  }, []);

  // Fallback local se a API falhar
  const getDefaultIcons = (): IconOption[] => [
    // RECEITAS
    {
      value: 'fas fa-money-bill-wave',
      label: 'Salário',
      color: '#10B981',
      keywords: ['salário', 'salary', 'pagamento'],
      group: 'income',
    },
    {
      value: 'fas fa-laptop-code',
      label: 'Freelance',
      color: '#3B82F6',
      keywords: ['freelance', 'autônomo'],
      group: 'income',
    },
    {
      value: 'fas fa-chart-line',
      label: 'Investimentos',
      color: '#8B5CF6',
      keywords: ['investimento', 'ações'],
      group: 'income',
    },
    {
      value: 'fas fa-home',
      label: 'Aluguel',
      color: '#F59E0B',
      keywords: ['aluguel', 'rent'],
      group: 'income',
    },
    {
      value: 'fas fa-store',
      label: 'Vendas',
      color: '#8B5CF6',
      keywords: ['venda', 'loja'],
      group: 'income',
    },
    // DESPESAS
    {
      value: 'fas fa-utensils',
      label: 'Alimentação',
      color: '#EF4444',
      keywords: ['comida', 'alimentação'],
      group: 'expense',
    },
    {
      value: 'fas fa-car',
      label: 'Transporte',
      color: '#6366F1',
      keywords: ['transporte', 'carro'],
      group: 'expense',
    },
    {
      value: 'fas fa-heartbeat',
      label: 'Saúde',
      color: '#EC4899',
      keywords: ['saúde', 'médico'],
      group: 'expense',
    },
    {
      value: 'fas fa-graduation-cap',
      label: 'Educação',
      color: '#14B8A6',
      keywords: ['educação', 'curso'],
      group: 'expense',
    },
    {
      value: 'fas fa-film',
      label: 'Entretenimento',
      color: '#8B5CF6',
      keywords: ['entretenimento', 'cinema'],
      group: 'expense',
    },
    {
      value: 'fas fa-shopping-bag',
      label: 'Compras',
      color: '#F59E0B',
      keywords: ['compras', 'shopping'],
      group: 'expense',
    },
    {
      value: 'fas fa-file-invoice-dollar',
      label: 'Contas',
      color: '#10B981',
      keywords: ['conta', 'luz'],
      group: 'expense',
    },
    {
      value: 'fas fa-shopping-cart',
      label: 'Supermercado',
      color: '#EF4444',
      keywords: ['supermercado', 'mercado'],
      group: 'expense',
    },
    {
      value: 'fas fa-plane',
      label: 'Viagem',
      color: '#3B82F6',
      keywords: ['viagem', 'férias'],
      group: 'expense',
    },
    {
      value: 'fas fa-gift',
      label: 'Presentes',
      color: '#EC4899',
      keywords: ['presente', 'lembrança'],
      group: 'expense',
    },
    // GERAL
    {
      value: 'fas fa-circle',
      label: 'Geral',
      color: '#6B7280',
      keywords: ['outro', 'diversos'],
      group: 'general',
    },
    {
      value: 'fas fa-exchange-alt',
      label: 'Transferência',
      color: '#6B7280',
      keywords: ['transferência', 'pix'],
      group: 'general',
    },
    {
      value: 'fas fa-piggy-bank',
      label: 'Economia',
      color: '#10B981',
      keywords: ['economia', 'poupança'],
      group: 'general',
    },
  ];

  // Busca ícone por nome da categoria
  const getIconForCategory = async (
    categoryName: string
  ): Promise<{ icon: string; color: string }> => {
    if (!categoryName.trim()) {
      return { icon: 'fas fa-circle', color: '#6B7280' };
    }

    try {
      // Tenta obter sugestão da API
      const response = await fetch(
        `/api/categories/icons/suggest?name=${encodeURIComponent(categoryName)}`
      );
      if (response.ok) {
        const suggestedIcon: IconOption = await response.json();
        return { icon: suggestedIcon.value, color: suggestedIcon.color };
      }
    } catch (error) {
      // Fallback para busca local
      const name = categoryName.toLowerCase();
      const matchedIcon = icons.find((icon) =>
        icon.keywords.some((keyword) => name.includes(keyword.toLowerCase()))
      );

      if (matchedIcon) {
        return { icon: matchedIcon.value, color: matchedIcon.color };
      }
    }

    // Ícone padrão
    return { icon: 'fas fa-circle', color: '#6B7280' };
  };

  // Busca síncrona (para uso quando não puder esperar a API)
  const getIconForCategorySync = (categoryName: string): { icon: string; color: string } => {
    const name = categoryName.toLowerCase();
    const localIcons = getDefaultIcons();

    const matchedIcon = localIcons.find((icon) =>
      icon.keywords.some((keyword) => name.includes(keyword.toLowerCase()))
    );

    return matchedIcon
      ? { icon: matchedIcon.value, color: matchedIcon.color }
      : { icon: 'fas fa-circle', color: '#6B7280' };
  };

  return {
    icons,
    loading,
    getIconForCategory,
    getIconForCategorySync,
  };
};
