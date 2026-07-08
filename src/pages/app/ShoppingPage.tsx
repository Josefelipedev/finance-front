import ShoppingManager from '../../components/finance-metrics/shopping/ShoppingManager';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function ShoppingPage() {
  return (
    <PageShell title="Compras" description="Listas de compras compartilhadas do casal">
      <Surface className="p-4 sm:p-6">
        <ShoppingManager />
      </Surface>
    </PageShell>
  );
}
