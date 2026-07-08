import CategoryManager from '../../components/finance-metrics/categories/CategoryManager';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function CategoriesPage() {
  return (
    <PageShell title="Categorias" description="Organize como as transações são classificadas">
      <Surface className="p-4 sm:p-6">
        <CategoryManager />
      </Surface>
    </PageShell>
  );
}
