import { useEffect, useMemo } from 'react';
import { useBankAccounts } from '../../hooks/useBankAccounts';

interface BankAccountSelectProps {
  value?: number | null;
  onChange: (accountId: number | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
  id?: string;
}

/** "Jose Felipe" → "Jose" (o apelido não cabe num dropdown). */
const firstName = (name?: string | null) => name?.trim().split(/\s+/)[0] ?? null;

/**
 * Seletor de conta bancária PADRÃO (dropdown por id, alimentado por
 * useBankAccounts).
 *
 * Existe porque a conta bancária deixou de ser só um detalhe do lançamento:
 * é dela que sai a previsão "o que fica em cada conta no fim do mês", e por
 * isso passou a aparecer em três formulários (lançamento, conta a pagar e
 * recorrente). Três `<select>` escritos à mão eram três sítios para o mesmo
 * detalhe divergir — a começar pelo nome da opção vazia.
 *
 * Num casal, o dono só aparece quando há contas de mais do que uma pessoa:
 * quando são todas do próprio, escrever o nome dele em cada linha é ruído.
 */
export default function BankAccountSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Sem conta',
  error,
  className = '',
  id,
}: BankAccountSelectProps) {
  const { accounts, loadAccounts } = useBankAccounts();

  useEffect(() => {
    if (!accounts || accounts.length === 0) {
      loadAccounts().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showOwner = useMemo(
    () => new Set(accounts.map((a) => a.userId)).size > 1,
    [accounts]
  );

  return (
    <select
      id={id}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      className={`h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 dark:bg-gray-900 dark:text-white/90 ${
        error
          ? 'border-error-500 focus:border-error-500'
          : 'border-gray-300 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800'
      } ${value ? 'text-gray-800 dark:text-white/90' : 'text-gray-400'} ${className}`}
    >
      <option value="">{placeholder}</option>
      {accounts.map((a) => {
        const owner = showOwner ? firstName(a.user?.name) : null;
        return (
          <option key={a.id} value={a.id} className="text-gray-800 dark:text-white/90">
            {a.bankName} · {a.currency}
            {owner ? ` — ${owner}` : ''}
          </option>
        );
      })}
    </select>
  );
}
