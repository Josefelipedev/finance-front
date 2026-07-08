import BudgetManager from '../../components/finance-metrics/budget/BudgetManager';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function BudgetPage() {
  return (
    <PageShell title="Orçamento" description="Limites por categoria e acompanhamento do mês">
      <Surface className="p-4 sm:p-6">
        <BudgetManager />
      </Surface>
    </PageShell>
  );
}
