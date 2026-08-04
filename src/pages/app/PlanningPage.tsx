import PageShell from '../../components/common/PageShell';
import PlanningView from '../../components/finance-metrics/planning/PlanningView';

export default function PlanningPage() {
  return (
    <PageShell
      title="Planeamento"
      description="Projete os próximos anos a partir do seu histórico, teste cenários e veja se as metas cabem no que sobra."
    >
      <PlanningView />
    </PageShell>
  );
}
