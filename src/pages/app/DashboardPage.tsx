import { useState } from 'react';
import FinanceDashboard from '../../components/finance-metrics/FinanceDashboard';
import CategoryDistribution from '../../components/finance-metrics/CategoryDistribution';
import FinanceGoals from '../../components/finance-metrics/goals/FinanceGoals';
import DateRangePicker from '../../components/ui/date-range-picker';
import PageShell from '../../components/common/PageShell';
import { defaultDateRange } from '../../utils/date-range';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState(defaultDateRange);

  return (
    <PageShell
      title="Visão geral"
      description="O pulso das finanças do casal, num só lugar"
      actions={
        <div className="rounded-xl border border-gray-200 bg-white p-1 dark:border-white/[0.06] dark:bg-gray-800">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onStartDateChange={(date) => setDateRange((prev) => ({ ...prev, startDate: date }))}
            onEndDateChange={(date) => setDateRange((prev) => ({ ...prev, endDate: date }))}
            startLabel=""
            endLabel=""
            className="w-full"
          />
        </div>
      }
    >
      <FinanceDashboard dateRange={dateRange} setDateRange={setDateRange} />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <CategoryDistribution dateRange={dateRange} />
        <FinanceGoals />
      </div>
    </PageShell>
  );
}
