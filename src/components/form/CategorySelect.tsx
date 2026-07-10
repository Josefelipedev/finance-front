import { useEffect } from 'react';
import { useFinanceCategory } from '../../hooks/useFinanceCategory';

interface CategorySelectProps {
  value?: number;
  onChange: (categoryId: number | undefined) => void;
  /** Filtra por tipo da categoria (income/expense/both). Omitir = todas. */
  type?: 'income' | 'expense';
  placeholder?: string;
  error?: string;
  className?: string;
  id?: string;
}

/**
 * Seletor de categoria PADRÃO (dropdown por ID, alimentado por useFinanceCategory).
 * Controlado: passe `value` (categoryId) e `onChange`. Use em vez de campo de
 * texto livre para não criar categorias-fantasma.
 */
export default function CategorySelect({
  value,
  onChange,
  type,
  placeholder = 'Selecione uma categoria',
  error,
  className = '',
  id,
}: CategorySelectProps) {
  const { categories, getAllCategories } = useFinanceCategory();

  useEffect(() => {
    if (!categories || categories.length === 0) {
      getAllCategories().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtra por tipo quando a categoria expõe `type` (income/expense/both);
  // se o campo não vier da API, mostra todas (defensivo).
  const visible = type
    ? categories.filter((c) => {
        const ct = (c as { type?: string }).type;
        return !ct || ct === type || ct === 'both';
      })
    : categories;

  return (
    <select
      id={id}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      className={`h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 ${
        error
          ? 'border-error-500 focus:border-error-500'
          : 'border-gray-300 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800'
      } ${value ? 'text-gray-800 dark:text-white/90' : 'text-gray-400'} ${className}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {visible.map((c) => (
        <option key={c.id} value={c.id} className="text-gray-800 dark:text-white/90">
          {c.name}
        </option>
      ))}
    </select>
  );
}
