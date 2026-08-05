import { useState } from 'react';
import { Surface } from '../../common/PageShell';
import Button from '../../ui/button/Button';
import { Modal } from '../../ui/modal';
import { useConfirm } from '../../ui/confirm/useConfirm';
import Label from '../../form/Label';
import Input from '../../form/input/InputField';
import MoneyInput from '../../form/MoneyInput';
import CategorySelect from '../../form/CategorySelect';
import { currencyOption, formatMoney } from '../../../utils/currency';
import type {
  EventFrequency,
  EventInput,
  FlowType,
  PlanEvent,
  PlanScenario,
  ScenarioInput,
} from '../../../hooks/usePlanning';

interface Props {
  scenarios: PlanScenario[];
  activeScenarioId: number | null;
  displayCurrency: string;
  isSaving: boolean;
  onSelect: (id: number | null) => void;
  onCreateScenario: (input: ScenarioInput) => Promise<unknown>;
  onUpdateScenario: (id: number, input: Partial<ScenarioInput>) => Promise<unknown>;
  onDeleteScenario: (id: number) => Promise<unknown>;
  onCreateEvent: (scenarioId: number, input: EventInput) => Promise<unknown>;
  onUpdateEvent: (id: number, input: Partial<EventInput>) => Promise<unknown>;
  onDeleteEvent: (id: number) => Promise<unknown>;
}

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const frequencyLabel: Record<EventFrequency, string> = {
  monthly: 'Todos os meses',
  yearly: 'Uma vez por ano',
  once: 'Uma única vez',
};

const emptyScenario: ScenarioInput = {
  name: '',
  description: '',
  horizonYears: 5,
  inflationPct: 2,
  incomeGrowthPct: 0,
  savingsReturnPct: 0,
};

const emptyEvent: EventInput = {
  name: '',
  type: 'expense',
  amount: 0,
  frequency: 'monthly',
  startMonth: currentMonth(),
  endMonth: null,
  categoryId: null,
  growsWithInflation: false,
};

/**
 * Os cenários e os "e se" de cada um.
 *
 * Um cenário não mexe em lançamento nenhum: é só um conjunto de premissas e de
 * alterações hipotéticas. É o que permite perguntar "e se comprarmos casa em
 * 2028?" sem ter de sujar o histórico para ver a resposta.
 */
export default function ScenariosTab({
  scenarios,
  activeScenarioId,
  displayCurrency,
  isSaving,
  onSelect,
  onCreateScenario,
  onUpdateScenario,
  onDeleteScenario,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: Props) {
  const { confirm, dialog } = useConfirm();
  const symbol = currencyOption(displayCurrency).symbol;

  const [scenarioForm, setScenarioForm] = useState<ScenarioInput | null>(null);
  const [editingScenarioId, setEditingScenarioId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState<EventInput | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventScenarioId, setEventScenarioId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const openNewScenario = () => {
    setEditingScenarioId(null);
    setScenarioForm({ ...emptyScenario });
    setFormError(null);
  };

  const openEditScenario = (scenario: PlanScenario) => {
    setEditingScenarioId(scenario.id);
    setScenarioForm({
      name: scenario.name,
      description: scenario.description ?? '',
      horizonYears: scenario.horizonYears,
      inflationPct: scenario.inflationPct,
      incomeGrowthPct: scenario.incomeGrowthPct,
      savingsReturnPct: scenario.savingsReturnPct,
      startingNetWorth: scenario.startingNetWorth,
    });
    setFormError(null);
  };

  const submitScenario = async () => {
    if (!scenarioForm) return;
    if (!scenarioForm.name.trim()) {
      setFormError('Dê um nome ao cenário.');
      return;
    }
    try {
      if (editingScenarioId) await onUpdateScenario(editingScenarioId, scenarioForm);
      else await onCreateScenario(scenarioForm);
      setScenarioForm(null);
    } catch {
      setFormError('Não foi possível gravar o cenário.');
    }
  };

  const removeScenario = async (scenario: PlanScenario) => {
    const ok = await confirm({
      title: 'Apagar cenário',
      message: `"${scenario.name}" e os seus ${scenario.events.length} eventos serão apagados. Os seus lançamentos não são tocados.`,
      danger: true,
      confirmText: 'Apagar',
    });
    if (ok) await onDeleteScenario(scenario.id);
  };

  const openNewEvent = (scenarioId: number) => {
    setEventScenarioId(scenarioId);
    setEditingEventId(null);
    setEventForm({ ...emptyEvent });
    setFormError(null);
  };

  const openEditEvent = (event: PlanEvent) => {
    setEventScenarioId(event.scenarioId);
    setEditingEventId(event.id);
    setEventForm({
      name: event.name,
      type: event.type,
      amount: event.amount,
      frequency: event.frequency,
      startMonth: event.startMonth,
      endMonth: event.endMonth,
      categoryId: event.categoryId,
      growsWithInflation: event.growsWithInflation,
      isActive: event.isActive,
    });
    setFormError(null);
  };

  const submitEvent = async () => {
    if (!eventForm || !eventScenarioId) return;
    if (!eventForm.name.trim()) {
      setFormError('Dê um nome ao evento.');
      return;
    }
    if (eventForm.amount <= 0) {
      setFormError('O valor tem de ser maior que zero.');
      return;
    }
    if (eventForm.endMonth && eventForm.endMonth < eventForm.startMonth) {
      setFormError('O fim não pode ser antes do início.');
      return;
    }
    try {
      if (editingEventId) await onUpdateEvent(editingEventId, eventForm);
      else await onCreateEvent(eventScenarioId, eventForm);
      setEventForm(null);
    } catch {
      setFormError('Não foi possível gravar o evento.');
    }
  };

  const removeEvent = async (event: PlanEvent) => {
    const ok = await confirm({
      title: 'Apagar evento',
      message: `"${event.name}" sai deste cenário.`,
      danger: true,
      confirmText: 'Apagar',
    });
    if (ok) await onDeleteEvent(event.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Um cenário é um conjunto de premissas mais as alterações que se quer testar.
          Nada aqui mexe nos seus lançamentos — serve para comparar caminhos.
        </p>
        <Button size="sm" type="button" onClick={openNewScenario}>
          Novo cenário
        </Button>
      </div>

      {scenarios.length === 0 && (
        <Surface className="p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ainda não há cenários. A projeção que está a ver usa o rumo actual: a média
            dos últimos 12 meses, 2% de inflação e 5 anos de horizonte.
          </p>
          <div className="mt-4 flex justify-center">
            <Button size="sm" type="button" onClick={openNewScenario}>
              Criar o primeiro
            </Button>
          </div>
        </Surface>
      )}

      <div className="space-y-4">
        {scenarios.map((scenario) => {
          const isActive = scenario.id === activeScenarioId;
          return (
            <Surface
              key={scenario.id}
              className={`p-4 sm:p-5 ${isActive ? 'ring-2 ring-brand-400' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
                      {scenario.name}
                    </h3>
                    {scenario.isBaseline && (
                      <span className="rounded-full bg-brand-400/15 px-2 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-400">
                        Referência
                      </span>
                    )}
                  </div>
                  {scenario.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {scenario.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {scenario.horizonYears} anos · inflação {scenario.inflationPct}% ·
                    receita {scenario.incomeGrowthPct >= 0 ? '+' : ''}
                    {scenario.incomeGrowthPct}% · poupança {scenario.savingsReturnPct}%
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => onSelect(scenario.id)}
                    >
                      Ver projeção
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => openEditScenario(scenario)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => removeScenario(scenario)}
                  >
                    Apagar
                  </Button>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    O que muda neste cenário
                  </h4>
                  <button
                    type="button"
                    onClick={() => openNewEvent(scenario.id)}
                    className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    + Adicionar
                  </button>
                </div>

                {scenario.events.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sem alterações — este cenário é igual ao rumo actual, só com outras
                    premissas.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {scenario.events.map((event) => (
                      <li
                        key={event.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              event.isActive
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 line-through dark:text-gray-500'
                            }`}
                          >
                            {event.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {frequencyLabel[event.frequency]} · desde {event.startMonth}
                            {event.endMonth ? ` até ${event.endMonth}` : ''}
                            {event.growsWithInflation ? ' · acompanha a inflação' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-medium ${
                              event.type === 'income'
                                ? 'text-success-600 dark:text-success-400'
                                : 'text-error-500 dark:text-error-400'
                            }`}
                          >
                            {event.type === 'income' ? '+' : '−'}
                            {formatMoney(event.amount, event.currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditEvent(event)}
                            className="text-xs text-gray-500 hover:text-brand-500 dark:text-gray-400"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEvent(event)}
                            className="text-xs text-gray-500 hover:text-error-500 dark:text-gray-400"
                          >
                            Apagar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Surface>
          );
        })}
      </div>

      {/* ── Modal do cenário ── */}
      <Modal
        isOpen={scenarioForm !== null}
        onClose={() => setScenarioForm(null)}
        className="max-w-lg"
      >
        {scenarioForm && (
          <div className="p-6">
            <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
              {editingScenarioId ? 'Editar cenário' : 'Novo cenário'}
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="scenario-name">Nome</Label>
                <Input
                  id="scenario-name"
                  value={scenarioForm.name}
                  placeholder="Comprar casa em 2028"
                  onChange={(e) =>
                    setScenarioForm({ ...scenarioForm, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="scenario-desc">Descrição</Label>
                <Input
                  id="scenario-desc"
                  value={scenarioForm.description ?? ''}
                  placeholder="Opcional"
                  onChange={(e) =>
                    setScenarioForm({ ...scenarioForm, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="scenario-horizon">Horizonte (anos)</Label>
                  <Input
                    id="scenario-horizon"
                    type="number"
                    min={1}
                    max={30}
                    value={scenarioForm.horizonYears ?? 5}
                    onChange={(e) =>
                      setScenarioForm({
                        ...scenarioForm,
                        horizonYears: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="scenario-inflation">Inflação (% ao ano)</Label>
                  <Input
                    id="scenario-inflation"
                    type="number"
                    step="0.1"
                    value={scenarioForm.inflationPct ?? 0}
                    onChange={(e) =>
                      setScenarioForm({
                        ...scenarioForm,
                        inflationPct: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="scenario-income">Receita (% ao ano)</Label>
                  <Input
                    id="scenario-income"
                    type="number"
                    step="0.1"
                    value={scenarioForm.incomeGrowthPct ?? 0}
                    onChange={(e) =>
                      setScenarioForm({
                        ...scenarioForm,
                        incomeGrowthPct: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="scenario-return">Poupança rende (% ao ano)</Label>
                  <Input
                    id="scenario-return"
                    type="number"
                    step="0.1"
                    value={scenarioForm.savingsReturnPct ?? 0}
                    onChange={(e) =>
                      setScenarioForm({
                        ...scenarioForm,
                        savingsReturnPct: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                A inflação faz as despesas subirem, o crescimento de receita faz os ganhos
                subirem, e o rendimento aplica-se ao dinheiro já poupado. Todas compostas
                ao mês.
              </p>

              {formError && (
                <p className="text-sm text-error-500 dark:text-error-400">{formError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setScenarioForm(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" type="button" disabled={isSaving} onClick={submitScenario}>
                {isSaving ? 'A gravar...' : 'Gravar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal do evento ── */}
      <Modal
        isOpen={eventForm !== null}
        onClose={() => setEventForm(null)}
        className="max-w-lg"
      >
        {eventForm && (
          <div className="p-6">
            <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
              {editingEventId ? 'Editar alteração' : 'Nova alteração'}
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="event-name">O que é</Label>
                <Input
                  id="event-name"
                  value={eventForm.name}
                  placeholder="Prestação da casa"
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="event-type">Entra ou sai</Label>
                  <select
                    id="event-type"
                    value={eventForm.type}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, type: e.target.value as FlowType })
                    }
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  >
                    <option value="expense">Sai (despesa)</option>
                    <option value="income">Entra (receita)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="event-amount">Valor</Label>
                  <MoneyInput
                    id="event-amount"
                    value={eventForm.amount}
                    currencySymbol={symbol}
                    onChange={(amount) => setEventForm({ ...eventForm, amount })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="event-category">Categoria</Label>
                <CategorySelect
                  id="event-category"
                  value={eventForm.categoryId ?? undefined}
                  type={eventForm.type}
                  placeholder="Sem categoria"
                  allowEmpty
                  onChange={(categoryId) =>
                    setEventForm({ ...eventForm, categoryId: categoryId ?? null })
                  }
                />
              </div>

              <div>
                <Label htmlFor="event-frequency">Com que frequência</Label>
                <select
                  id="event-frequency"
                  value={eventForm.frequency}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      frequency: e.target.value as EventFrequency,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="monthly">Todos os meses</option>
                  <option value="yearly">Uma vez por ano</option>
                  <option value="once">Uma única vez</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="event-start">A partir de</Label>
                  <Input
                    id="event-start"
                    type="month"
                    value={eventForm.startMonth}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, startMonth: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="event-end">Até (opcional)</Label>
                  <Input
                    id="event-end"
                    type="month"
                    value={eventForm.endMonth ?? ''}
                    disabled={eventForm.frequency === 'once'}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, endMonth: e.target.value || null })
                    }
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={eventForm.growsWithInflation ?? false}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, growsWithInflation: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-400 focus:ring-brand-500/20 dark:border-gray-700"
                />
                Acompanha a inflação
              </label>
              <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
                Sem isto o valor fica em dinheiro de hoje — o que costuma ser o certo para
                uma prestação fixa, e errado para uma despesa como a creche.
              </p>

              {formError && (
                <p className="text-sm text-error-500 dark:text-error-400">{formError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setEventForm(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" type="button" disabled={isSaving} onClick={submitEvent}>
                {isSaving ? 'A gravar...' : 'Gravar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {dialog}
    </div>
  );
}
