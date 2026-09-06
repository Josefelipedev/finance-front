import { useState } from 'react';
import BudgetManager from '../../components/finance-metrics/budget/BudgetManager';
import YearPlanPanel from '../../components/finance-metrics/planning/YearPlanPanel';
import RulesView from '../../components/finance-metrics/rules/RulesView';
import PageShell, { Surface } from '../../components/common/PageShell';
import SegmentedTabs from '../../components/common/SegmentedTabs';

type TabKey = 'month' | 'year' | 'rules';

/**
 * O Orçamento, nos três andares em que se decide gastar.
 *
 * **Mês** é o tecto de cada categoria. **Ano** é a mesma decisão com outro
 * horizonte — viviam em ecrãs diferentes e escondiam quando se contradiziam.
 * **Regra** está um andar acima dos dois: não diz quanto se pode gastar em
 * cada sítio, diz que proporção do que entra vai para o que não se evita, para
 * o que se escolhe e para o que fica. É a pergunta que somar tectos nunca
 * responde, porque nenhum tecto olha para o rendimento.
 */
export default function BudgetPage() {
  const [tab, setTab] = useState<TabKey>('month');

  return (
    <PageShell
      title="Orçamento"
      description="Quanto se decide gastar — no mês, no ano, e em que proporção"
    >
      <SegmentedTabs
        tabs={[
          { key: 'month' as const, label: 'Mês' },
          { key: 'year' as const, label: 'Ano' },
          { key: 'rules' as const, label: 'Regra' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'month' && (
        <Surface className="p-4 sm:p-6">
          <BudgetManager />
        </Surface>
      )}
      {tab === 'year' && <YearPlanPanel />}
      {tab === 'rules' && <RulesView />}
    </PageShell>
  );
}
