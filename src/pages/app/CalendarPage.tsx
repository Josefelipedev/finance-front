import TransactionsCalendar from '../../components/finance-metrics/TransactionsCalendar';
import PageShell, { Surface } from '../../components/common/PageShell';

export default function CalendarPage() {
  return (
    <PageShell title="Calendário" description="Transações e vencimentos dia a dia">
      <Surface className="p-4 sm:p-6">
        <TransactionsCalendar />
      </Surface>
    </PageShell>
  );
}
