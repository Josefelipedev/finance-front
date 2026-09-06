import { useState } from 'react';
import PageShell from '../../components/common/PageShell';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import FinanceGoals from '../../components/finance-metrics/goals/FinanceGoals';
import LongTermGoalsPanel from '../../components/finance-metrics/planning/LongTermGoalsPanel';

type TabKey = 'goals' | 'longTerm';

/**
 * As metas, de perto e de longe.
 *
 * A lista diz quanto já se juntou em cada uma. O longo prazo diz outra coisa,
 * e mais desconfortável: se o ritmo actual chega para o prazo, e se a soma de
 * todas cabe no que sobra ao fim do mês. Eram dois ecrãs que não se conheciam
 * — dava para ver uma meta "80% feita" sem nunca saber que o dinheiro para a
 * acabar não existe.
 */
export default function GoalsPage() {
  const [tab, setTab] = useState<TabKey>('goals');

  return (
    <PageShell
      title="Metas"
      description="Objetivos financeiros, o progresso de cada um e se cabem no que sobra"
    >
      <SegmentedTabs
        tabs={[
          { key: 'goals' as const, label: 'As minhas metas' },
          { key: 'longTerm' as const, label: 'Cabem no que sobra?' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'goals' ? <FinanceGoals /> : <LongTermGoalsPanel />}
    </PageShell>
  );
}
