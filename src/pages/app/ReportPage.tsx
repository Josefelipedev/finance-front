import MonthlyReport from '../../components/finance-metrics/MonthlyReport';
import PageShell from '../../components/common/PageShell';

export default function ReportPage() {
  return (
    <PageShell
      title="Relatório financeiro"
      description="Entenda o que mudou, para onde foi o dinheiro e como o mês está evoluindo"
    >
      <MonthlyReport />
    </PageShell>
  );
}
