import { useCallback, useEffect } from 'react';
import { Surface } from '../../common/PageShell';
import { usePlanning } from '../../../hooks/usePlanning';
import { useGoals } from '../../../hooks/useGoals';
import LongTermGoalsTab from './LongTermGoalsTab';

/**
 * As metas vistas de longe: cabem no que sobra?
 *
 * A lista das Metas diz quanto já se juntou; isto diz se o ritmo chega para o
 * prazo, e se a soma de todas cabe no excedente mensal. São a mesma pergunta
 * em dois horizontes, e por isso passaram a ser duas abas do mesmo ecrã em vez
 * de dois ecrãs que não se conheciam.
 */
export default function LongTermGoalsPanel() {
  const { overview, isSaving, error, loadOverview } = usePlanning();
  const { updateGoal } = useGoals();

  const refresh = useCallback(
    () => loadOverview(null).catch(() => {}),
    [loadOverview],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (error && !overview) {
    return (
      <Surface className="p-6 text-center">
        <p className="text-sm text-error-500 dark:text-error-400">
          Não foi possível calcular o ritmo das metas.
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
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
        A ver se as metas cabem no que sobra...
      </Surface>
    );
  }

  return (
    <LongTermGoalsTab
      goalPlan={overview.goalPlan}
      isSaving={isSaving}
      onUpdateGoal={async (id, data) => {
        await updateGoal(id, data);
        // Mudar a prioridade ou o prazo muda o veredicto de TODAS as metas —
        // o excedente é um só e reparte-se por ordem.
        await refresh();
      }}
    />
  );
}
