import GrocerySearchManager from '../../components/finance-metrics/grocery/GrocerySearchManager';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function GroceryPage() {
  return (
    <PageShell title="Preços" description="Compare preços de mercado antes de comprar">
      <Surface className="p-4 sm:p-6">
        <GrocerySearchManager />
      </Surface>
    </PageShell>
  );
}
