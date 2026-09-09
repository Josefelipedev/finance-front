import type { DebtKind } from '../../../hooks/useDebts';

/** O nome de cada família, na língua de quem lê o ecrã. */
export const KIND_LABEL: Record<DebtKind, string> = {
  CREDIT_CARD: 'Cartão de crédito',
  LOAN: 'Empréstimo',
  INSTALLMENT: 'Parcelamento',
  OVERDRAFT: 'Descoberto',
  PERSONAL: 'Dívida pessoal',
  OTHER: 'Outra',
};

export const KIND_ICON: Record<DebtKind, string> = {
  CREDIT_CARD: 'fa-credit-card',
  LOAN: 'fa-building-columns',
  INSTALLMENT: 'fa-file-invoice-dollar',
  OVERDRAFT: 'fa-arrow-trend-down',
  PERSONAL: 'fa-handshake',
  OTHER: 'fa-receipt',
};

export const KIND_OPTIONS = (Object.keys(KIND_LABEL) as DebtKind[]).map((key) => ({
  value: key,
  label: KIND_LABEL[key],
}));

/**
 * Meses escritos para uma pessoa: 18 meses é "1 ano e 6 meses", não "18".
 *
 * Um plano mede-se em anos e ninguém divide 47 por 12 de cabeça — e é
 * precisamente a ordem de grandeza ("são quatro anos?") que faz alguém mexer no
 * extra do mês.
 */
export function monthsLabel(months: number | null): string {
  if (months == null) return '—';
  if (months === 0) return 'agora';
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const anos = Math.floor(months / 12);
  const resto = months % 12;
  const parteAnos = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  if (resto === 0) return parteAnos;
  return `${parteAnos} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`;
}
