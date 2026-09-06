import { useCallback, useEffect, useState } from 'react';
import { Surface } from '../../common/PageShell';
import SegmentedTabs from '../../common/SegmentedTabs';
import { usePlanning } from '../../../hooks/usePlanning';
import ProjectionTab from './ProjectionTab';
import ScenariosTab from './ScenariosTab';

type TabKey = 'projection' | 'scenarios';

/**
 * Onde é que este rumo vai dar — e o que muda se algo mudar.
 *
 * Era um ecrã só seu (`/planejamento`) e ninguém lá chegava: nenhum dos outros
 * vinte ecrãs apontava para ele. Agora vive dentro das Análises, que é onde
 * já se vai perguntar "o que é que os meus números dizem" — a diferença é só
 * que estas duas abas perguntam-no sobre o futuro em vez do passado.
 *
 * As outras três abas que ali viviam foram para onde já havia casa: as metas
 * de longo prazo para as Metas, o plano anual e a regra para o Orçamento.
 */
export default function ProjectionPanel() {
  const [tab, setTab] = useState<TabKey>('projection');
  const [scenarioId, setScenarioId] = useState<number | null>(null);

  const {
    overview,
    isLoading,
    isSaving,
    error,
    loadOverview,
    createScenario,
    updateScenario,
    deleteScenario,
    createEvent,
    updateEvent,
    deleteEvent,
  } = usePlanning();

  const refresh = useCallback(
    (id?: number | null) => loadOverview(id ?? scenarioId).catch(() => {}),
    [loadOverview, scenarioId],
  );

  useEffect(() => {
    loadOverview(scenarioId).catch(() => {});
  }, [loadOverview, scenarioId]);

  // Uma alteração de cenário muda a projeção, que muda o excedente — por isso
  // qualquer gravação recarrega tudo.
  const afterChange = async (action: Promise<unknown>) => {
    await action;
    await refresh();
  };

  if (error && !overview) {
    return (
      <Surface className="p-6 text-center">
        <p className="text-sm text-error-500 dark:text-error-400">
          Não foi possível carregar a projeção.
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
      <SegmentedTabs
        tabs={[
          { key: 'projection' as const, label: 'Projeção' },
          { key: 'scenarios' as const, label: 'Cenários' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {overview.scenarios.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="scenario-picker" className="text-gray-500 dark:text-gray-400">
            Cenário:
          </label>
          {/*
            O "Rumo actual" tem de estar na lista. Sem ele, escolher um cenário
            era uma porta de sentido único: a lista só tinha cenários gravados e
            não havia como voltar à projeção sem cenário nenhum.
          */}
          <select
            id="scenario-picker"
            value={overview.projection.scenario.id ?? ''}
            onChange={(e) => setScenarioId(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-gray-300 bg-transparent px-2 py-1 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Rumo actual (sem cenário)</option>
            {overview.scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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
          // O botão promete "Ver projeção": mostrá-la é ir para lá, não trocar
          // o cenário em silêncio e deixar a pessoa na mesma lista.
          onSelect={(id) => {
            setScenarioId(id);
            setTab('projection');
          }}
          onCreateScenario={(input) => afterChange(createScenario(input))}
          onUpdateScenario={(id, input) => afterChange(updateScenario(id, input))}
          onDeleteScenario={async (id) => {
            await deleteScenario(id);
            if (id === scenarioId) setScenarioId(null);
            else await refresh();
          }}
          onCreateEvent={(sid, input) => afterChange(createEvent(sid, input))}
          onUpdateEvent={(id, input) => afterChange(updateEvent(id, input))}
          onDeleteEvent={(id) => afterChange(deleteEvent(id))}
        />
      )}
    </div>
  );
}
