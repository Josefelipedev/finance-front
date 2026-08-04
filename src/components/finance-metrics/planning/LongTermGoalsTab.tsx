import { useState } from 'react';
import { Surface } from '../../common/PageShell';
import Button from '../../ui/button/Button';
import { Modal } from '../../ui/modal';
import Label from '../../form/Label';
import Input from '../../form/input/InputField';
import MoneyInput from '../../form/MoneyInput';
import { currencyOption, formatMoney } from '../../../utils/currency';
import type { GoalPace, GoalPlan } from '../../../hooks/usePlanning';

interface Props {
  goalPlan: GoalPlan;
  isSaving: boolean;
  onUpdateGoal: (
    id: number,
    data: { monthlyContribution?: number; priority?: number },
  ) => Promise<unknown>;
}

const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);

/**
 * As metas contra o dinheiro que a projeção diz que vai sobrar.
 *
 * A barra de progresso do ecrã de Metas responde a "quanto já lá está". Aqui a
 * pergunta é outra e mais dura: **chega?** Uma meta bem encaminhada e outra
 * impossível têm o mesmo aspecto numa barra de progresso — não têm no ritmo
 * mensal que cada uma exige.
 */
export default function LongTermGoalsTab({ goalPlan, isSaving, onUpdateGoal }: Props) {
  const [editing, setEditing] = useState<GoalPace | null>(null);
  const [monthly, setMonthly] = useState(0);
  const [priority, setPriority] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const money = (v: number) => formatMoney(v, goalPlan.displayCurrency);
  const symbol = currencyOption(goalPlan.displayCurrency).symbol;

  const openEdit = (goal: GoalPace) => {
    setEditing(goal);
    setMonthly(goal.plannedMonthly ?? goal.requiredMonthly ?? 0);
    setPriority(goal.priority);
    setFormError(null);
  };

  const submit = async () => {
    if (!editing) return;
    try {
      await onUpdateGoal(editing.id, {
        monthlyContribution: monthly,
        priority,
      });
      setEditing(null);
    } catch {
      setFormError('Não foi possível gravar.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Sobra por mês
          </p>
          <p
            className={`mt-1 font-display text-xl font-semibold ${
              goalPlan.monthlySurplus >= 0
                ? 'text-success-600 dark:text-success-400'
                : 'text-error-500 dark:text-error-400'
            }`}
          >
            {money(goalPlan.monthlySurplus)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Segundo o cenário "{goalPlan.scenarioName}"
          </p>
        </Surface>

        <Surface className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            As metas exigem
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-gray-900 dark:text-white">
            {money(goalPlan.totalRequiredMonthly)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">por mês, somadas</p>
        </Surface>

        <Surface className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Depois das metas
          </p>
          <p
            className={`mt-1 font-display text-xl font-semibold ${
              goalPlan.feasible
                ? 'text-success-600 dark:text-success-400'
                : 'text-error-500 dark:text-error-400'
            }`}
          >
            {money(goalPlan.unallocatedMonthly)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {goalPlan.feasible ? 'O plano fecha' : 'Falta dinheiro'}
          </p>
        </Surface>
      </div>

      {!goalPlan.feasible && goalPlan.goals.length > 0 && (
        <Surface className="border-warning-300 p-4 dark:border-warning-500/40">
          <p className="text-sm text-warning-700 dark:text-warning-400">
            <strong>As metas não cabem no que sobra.</strong> Faltam{' '}
            {money(Math.abs(goalPlan.unallocatedMonthly))} por mês. Ou se adiam datas, ou
            se baixam alvos, ou se corta despesa — o plano abaixo já reparte o que há
            pela ordem de prioridade.
          </p>
        </Surface>
      )}

      {goalPlan.goals.length === 0 ? (
        <Surface className="p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Não há metas activas. Crie-as no ecrã de Metas — com uma data-alvo, aparecem
            aqui com o ritmo mensal que exigem.
          </p>
        </Surface>
      ) : (
        <div className="space-y-3">
          {goalPlan.goals.map((goal) => {
            const progress =
              goal.targetValue > 0
                ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
                : 0;

            return (
              <Surface key={goal.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
                        {goal.name}
                      </h3>
                      {goal.overdue ? (
                        <span className="rounded-full bg-error-500/15 px-2 py-0.5 text-xs font-medium text-error-600 dark:text-error-400">
                          Prazo passado
                        </span>
                      ) : goal.funded ? (
                        <span className="rounded-full bg-success-500/15 px-2 py-0.5 text-xs font-medium text-success-600 dark:text-success-400">
                          No caminho
                        </span>
                      ) : (
                        <span className="rounded-full bg-warning-500/15 px-2 py-0.5 text-xs font-medium text-warning-700 dark:text-warning-400">
                          Sem financiamento
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {money(goal.currentValue)} de {money(goal.targetValue)} · faltam{' '}
                      {money(goal.remaining)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => openEdit(goal)}
                  >
                    Definir ritmo
                  </Button>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-brand-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Prazo</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {goal.monthsRemaining == null
                        ? 'Sem data'
                        : `${goal.monthsRemaining} ${plural(goal.monthsRemaining, 'mês', 'meses')}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Exige por mês
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {goal.requiredMonthly == null ? '—' : money(goal.requiredMonthly)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ritmo definido
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {goal.plannedMonthly == null ? '—' : money(goal.plannedMonthly)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Do que sobra
                    </p>
                    <p
                      className={`font-medium ${
                        goal.funded
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-error-500 dark:text-error-400'
                      }`}
                    >
                      {money(goal.allocatedMonthly)}
                    </p>
                  </div>
                </div>

                {goal.shortfallMonthly > 0 && (
                  <p className="mt-3 text-xs text-error-500 dark:text-error-400">
                    Faltam {money(goal.shortfallMonthly)} por mês para esta meta ir ao
                    ritmo necessário.
                  </p>
                )}
                {goal.monthsAtPlannedPace != null && !goal.overdue && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Ao ritmo definido, fica completa em {goal.monthsAtPlannedPace}{' '}
                    {plural(goal.monthsAtPlannedPace, 'mês', 'meses')}.
                  </p>
                )}
              </Surface>
            );
          })}
        </div>
      )}

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} className="max-w-md">
        {editing && (
          <div className="p-6">
            <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
              Ritmo de "{editing.name}"
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A data-alvo exige{' '}
              {editing.requiredMonthly == null
                ? 'um ritmo que só se sabe com uma data'
                : money(editing.requiredMonthly)}{' '}
              por mês.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="goal-monthly">Pôr de lado por mês</Label>
                <MoneyInput
                  id="goal-monthly"
                  value={monthly}
                  currencySymbol={symbol}
                  onChange={setMonthly}
                />
              </div>
              <div>
                <Label htmlFor="goal-priority">Prioridade</Label>
                <Input
                  id="goal-priority"
                  type="number"
                  min={0}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Quanto maior, mais cedo é servida quando o dinheiro não chega para
                  todas.
                </p>
              </div>

              {formError && (
                <p className="text-sm text-error-500 dark:text-error-400">{formError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" type="button" disabled={isSaving} onClick={submit}>
                {isSaving ? 'A gravar...' : 'Gravar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
