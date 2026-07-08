import GlobalSearch from '../../components/finance-metrics/GlobalSearch';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function SearchPage() {
  return (
    <PageShell title="Buscar" description="Encontre qualquer transação, item ou categoria">
      <Surface className="p-4 sm:p-6">
        <GlobalSearch />
      </Surface>
    </PageShell>
  );
}
