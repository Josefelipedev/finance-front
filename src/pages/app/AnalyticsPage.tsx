import { useState } from 'react';
import AnalyticsView from '../../components/finance-metrics/AnalyticsView';
import DateRangePicker from '../../components/ui/date-range-picker';
import PageShell, { Surface } from '../../components/common/PageShell';
import { defaultDateRange } from '../../utils/date-range';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(defaultDateRange);

  return (
    <PageShell
      title="Análises"
      description="Tendências e padrões detalhados dos seus gastos"
      actions={
        <div className="rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.06] dark:bg-slate-800">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onStartDateChange={(date) => setDateRange((prev) => ({ ...prev, startDate: date }))}
            onEndDateChange={(date) => setDateRange((prev) => ({ ...prev, endDate: date }))}
            startLabel=""
            endLabel=""
          />
        </div>
      }
    >
      <Surface className="p-4 sm:p-6">
        <AnalyticsView dateRange={dateRange} />
      </Surface>
    </PageShell>
  );
}
