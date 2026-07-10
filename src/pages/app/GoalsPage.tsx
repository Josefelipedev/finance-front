import PageShell from '../../components/common/PageShell';
import FinanceGoals from '../../components/finance-metrics/goals/FinanceGoals';

export default function GoalsPage() {
  return (
    <PageShell
      title="Metas"
      description="Defina objetivos financeiros e acompanhe o progresso dos seus depósitos."
    >
      <FinanceGoals />
    </PageShell>
  );
}
