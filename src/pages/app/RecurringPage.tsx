import { Link } from 'react-router';
import RecurringManager from '../../components/finance-metrics/recurring/RecurringManager';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function RecurringPage() {
  return (
    <PageShell
      title="Recorrentes"
      description="Assinaturas, contas fixas e lançamentos automáticos"
      actions={
        <Link
          to="/contas-a-pagar"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          title="Ver as contas geradas por estas recorrentes"
        >
          <i className="fas fa-file-invoice-dollar text-xs"></i>
          Contas do mês
        </Link>
      }
    >
      <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
        <i className="fas fa-circle-info mr-2"></i>
        Cada recorrente gera automaticamente as suas ocorrências em{' '}
        <Link to="/contas-a-pagar" className="font-semibold underline underline-offset-2">
          Contas do mês
        </Link>
        , onde você marca como pago/recebido — e o pagamento vira um lançamento nas transações.
      </div>
      <Surface className="p-4 sm:p-6">
        <RecurringManager />
      </Surface>
    </PageShell>
  );
}
