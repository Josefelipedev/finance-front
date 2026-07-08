import RecurringManager from '../../components/finance-metrics/recurring/RecurringManager';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function RecurringPage() {
  return (
    <PageShell title="Recorrentes" description="Assinaturas, contas fixas e lançamentos automáticos">
      <Surface className="p-4 sm:p-6">
        <RecurringManager />
      </Surface>
    </PageShell>
  );
}
