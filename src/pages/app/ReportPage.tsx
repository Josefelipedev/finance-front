import MonthlyReport from '../../components/finance-metrics/MonthlyReport';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function ReportPage() {
  return (
    <PageShell title="Relatório mensal" description="Fechamento do mês: receitas, despesas e saldo">
      <Surface className="p-4 sm:p-6">
        <MonthlyReport />
      </Surface>
    </PageShell>
  );
}
