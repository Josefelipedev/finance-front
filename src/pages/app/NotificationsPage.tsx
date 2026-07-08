import NotificationsCenter from '../../components/finance-metrics/NotificationsCenter';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function NotificationsPage() {
  return (
    <PageShell title="Notificações" description="Alertas de orçamento, vencimentos e novidades">
      <Surface className="p-4 sm:p-6">
        <NotificationsCenter />
      </Surface>
    </PageShell>
  );
}
