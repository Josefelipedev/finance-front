import { useState } from 'react';
import AnalyticsView from '../../components/finance-metrics/AnalyticsView';
import ProjectionPanel from '../../components/finance-metrics/planning/ProjectionPanel';
import DateRangePicker from '../../components/ui/date-range-picker';
import PageShell, { Surface } from '../../components/common/PageShell';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import { defaultDateRange } from '../../utils/date-range';

type TabKey = 'past' | 'future';

/**
 * O que os números dizem — para trás e para a frente.
 *
 * As tendências olham para o que já aconteceu; a projeção e os cenários olham
 * para onde este rumo vai dar. É a mesma pergunta com o sinal trocado, e a
 * projeção vivia num ecrã só seu onde ninguém chegava: nenhum dos outros vinte
 * apontava para lá.
 */
export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [tab, setTab] = useState<TabKey>('past');

  return (
    <PageShell
      title="Análises"
      description="Tendências do que já foi, e para onde este rumo vai dar"
      actions={
        // O período só diz respeito ao passado: a projeção parte sempre do mês
        // seguinte e não tem intervalo que se escolha.
        tab === 'past' ? (
          <div className="rounded-xl border border-gray-200 bg-white p-1 dark:border-white/[0.06] dark:bg-gray-800">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onStartDateChange={(date) => setDateRange((prev) => ({ ...prev, startDate: date }))}
              onEndDateChange={(date) => setDateRange((prev) => ({ ...prev, endDate: date }))}
              startLabel=""
              endLabel=""
            />
          </div>
        ) : undefined
      }
    >
      <SegmentedTabs
        tabs={[
          { key: 'past' as const, label: 'O que já foi' },
          { key: 'future' as const, label: 'Para onde vai' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'past' ? (
        <Surface className="p-4 sm:p-6">
          <AnalyticsView dateRange={dateRange} />
        </Surface>
      ) : (
        <ProjectionPanel />
      )}
    </PageShell>
  );
}
