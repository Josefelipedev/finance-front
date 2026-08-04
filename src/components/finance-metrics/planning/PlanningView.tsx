import { useCallback, useEffect, useState } from 'react';
import { Surface } from '../../common/PageShell';
import { usePlanning } from '../../../hooks/usePlanning';
import { useGoals } from '../../../hooks/useGoals';
import ProjectionTab from './ProjectionTab';
import ScenariosTab from './ScenariosTab';
import LongTermGoalsTab from './LongTermGoalsTab';
import YearPlanTab from './YearPlanTab';

type TabKey = 'projection' | 'scenarios' | 'goals' | 'year';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'projection', label: 'Projeção' },
  { key: 'scenarios', label: 'Cenários' },
  { key: 'goals', label: 'Metas de longo prazo' },
  { key: 'year', label: 'Plano anual' },
];

/**
 * O ecrã de planeamento.
 *
 * As quatro abas respondem a perguntas diferentes sobre o mesmo dinheiro: onde
 * é que este rumo vai dar, o que muda se algo mudar, se as metas cabem no que
 * sobra, e quanto se decide gastar em cada categoria por ano. Todas partem da
 * mesma projeção — trocar de cenário numa muda todas.
 */
export default function PlanningView() {
  const [tab, setTab] = useState<TabKey>('projection');
  const [scenarioId, setScenarioId] = useState<number | null>(null);
  const [year, setYear] = useState(() => new Date().getFullYear() + 1);

  const {
    overview,
    yearPlan,
    isLoading,
    isSaving,
    error,
    loadOverview,
    loadYearPlan,
    createScenario,
    updateScenario,
    deleteScenario,
    createEvent,
    updateEvent,
    deleteEvent,
    saveYearPlan,
    deleteYearPlanItem,
  } = usePlanning();

  const { updateGoal } = useGoals();

  const refresh = useCallback(
    (id?: number | null) => loadOverview(id ?? scenarioId).catch(() => {}),
    [loadOverview, scenarioId],
  );

  useEffect(() => {
    loadOverview(scenarioId).catch(() => {});
  }, [loadOverview, scenarioId]);

  useEffect(() => {
    if (tab === 'year') loadYearPlan(year).catch(() => {});
  }, [tab, year, loadYearPlan]);

  // Uma alteração de cenário muda a projeção, que muda o excedente, que muda o
  // veredicto das metas — por isso qualquer gravação recarrega tudo.
  const afterChange = async (action: Promise<unknown>) => {
    await action;
    await refresh();
  };

  if (error && !overview) {
    return (
      <Surface className="p-6 text-center">
        <p className="text-sm text-error-500 dark:text-error-400">
          Não foi possível carregar o planeamento.
        </p>
        <button
          type="button"
          onClick={() => refresh()}
          className="mt-3 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          Tentar de novo
        </button>
      </Surface>
    );
  }

  if (!overview) {
    return (
      <Surface className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
        A montar a projeção...
      </Surface>
    );
  }

  return (
    <div className="space-y-5">
      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === item.key
                ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-white/[0.06] dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {overview.scenarios.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Cenário:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {overview.projection.scenario.name}
          </span>
          {overview.scenarios.length > 1 && (
            <select
              value={overview.projection.scenario.id ?? ''}
              onChange={(e) => setScenarioId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-gray-300 bg-transparent px-2 py-1 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {overview.scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          {isLoading && (
            <span className="text-xs text-gray-400 dark:text-gray-500">a actualizar...</span>
          )}
        </div>
      )}

      {tab === 'projection' && <ProjectionTab projection={overview.projection} />}

      {tab === 'scenarios' && (
        <ScenariosTab
          scenarios={overview.scenarios}
          activeScenarioId={overview.projection.scenario.id}
          displayCurrency={overview.projection.displayCurrency}
          isSaving={isSaving}
          onSelect={setScenarioId}
          onCreateScenario={(input) => afterChange(createScenario(input))}
          onUpdateScenario={(id, input) => afterChange(updateScenario(id, input))}
          onDeleteScenario={async (id) => {
            await deleteScenario(id);
            // O cenário apagado não pode continuar a ser o escolhido.
            if (id === scenarioId) setScenarioId(null);
            else await refresh();
          }}
          onCreateEvent={(sid, input) => afterChange(createEvent(sid, input))}
          onUpdateEvent={(id, input) => afterChange(updateEvent(id, input))}
          onDeleteEvent={(id) => afterChange(deleteEvent(id))}
        />
      )}

      {tab === 'goals' && (
        <LongTermGoalsTab
          goalPlan={overview.goalPlan}
          isSaving={isSaving}
          onUpdateGoal={(id, data) => afterChange(updateGoal(id, data))}
        />
      )}

      {tab === 'year' && (
        <YearPlanTab
          yearPlan={yearPlan}
          year={year}
          isLoading={isLoading}
          isSaving={isSaving}
          onChangeYear={setYear}
          onSave={async (y, items) => {
            await saveYearPlan(y, items);
            // O plano do ano entra na projeção: recarregar a visão geral.
            await refresh();
          }}
          onDeleteItem={async (y, categoryId) => {
            await deleteYearPlanItem(y, categoryId);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
