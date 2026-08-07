import { Link } from 'react-router';
import type { LinkedBill } from '../../hooks/useFinance';
import { billDueLabel, billMonth } from '../../utils/bill';

interface Props {
  bill: LinkedBill;
  className?: string;
}

/**
 * O crachá que diz que este lançamento **quita uma conta** (B5).
 *
 * O caminho inverso já existia — a conta mostra "Recorrente" com link para as
 * recorrentes. Deste lado não havia nada: em Transações, a renda de 500 € era
 * uma linha igual às outras, e apagá-la reabria a conta em silêncio. Quem vê a
 * lista não tinha como saber que aquela linha tem outra ponta.
 */
export default function BillLinkBadge({ bill, className = '' }: Props) {
  return (
    <Link
      to={`/contas-a-pagar?mes=${billMonth(bill.dueDate)}`}
      title={`Quita a conta "${bill.description}", com vencimento a ${billDueLabel(
        bill.dueDate
      )} — clique para a ver`}
      className={`inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-600 transition-colors hover:bg-brand-100 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-400 dark:hover:bg-brand-400/20 ${className}`}
    >
      <i className="fas fa-file-invoice-dollar text-[9px]"></i>
      Conta {billDueLabel(bill.dueDate)}
    </Link>
  );
}
