import PantryManager from '../../components/finance-metrics/pantry/PantryManager';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function PantryPage() {
  return (
    <PageShell title="Despensa" description="O que tem em casa, validade e reposição">
      <Surface className="p-4 sm:p-6">
        <PantryManager />
      </Surface>
    </PageShell>
  );
}
