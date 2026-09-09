import { useState } from 'react';
import type { ManualPlanBody } from '../../hooks/useMealPlanner';
import MoneyInput from '../../components/form/MoneyInput';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const SLOTS = [
  ['breakfast', 'Café da manhã'],
  ['lunch', 'Almoço'],
  ['dinner', 'Jantar'],
  ['snacks', 'Lanche'],
] as const;

type ManualDay = ManualPlanBody['days'][number];

interface Props {
  currencySymbol: string;
  initialBudget: number;
  onClose: () => void;
  onSave: (body: ManualPlanBody) => Promise<void>;
}

/** Editor simples: o plano manual entra no mesmo fluxo de compras e transações. */
export default function ManualPlanModal({ currencySymbol, initialBudget, onClose, onSave }: Props) {
  const [days, setDays] = useState<ManualDay[]>(DAYS.map((_, dayOfWeek) => ({ dayOfWeek })));
  const [budget, setBudget] = useState(initialBudget);
  const [notes, setNotes] = useState('');
  const [shopping, setShopping] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMeal = (
    dayOfWeek: number,
    slot: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    value: string
  ) => {
    setDays((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, [slot]: value } : day))
    );
  };

  const parseShoppingList = (): NonNullable<ManualPlanBody['shoppingList']> =>
    shopping
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = '', quantity = '1', unit = 'unidade', price = '0'] = line
          .split('|')
          .map((part) => part.trim());
        return {
          name,
          quantity: Number(quantity.replace(',', '.')) || 1,
          unit: unit || 'unidade',
          estimatedPrice: Number(price.replace(',', '.')) || 0,
          category: 'Outros',
        };
      });

  const submit = async () => {
    const hasMeal = days.some((day) => SLOTS.some(([slot]) => Boolean(day[slot]?.trim())));
    if (!hasMeal) {
      setError('Adicione pelo menos uma refeição.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        budget,
        notes: notes.trim() || undefined,
        days,
        shoppingList: parseShoppingList(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o plano.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="max-w-6xl">
      <div className="max-h-[90vh] overflow-y-auto p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Criar meu plano</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Escreva as refeições que quiser. A lista criada aqui poderá ser registrada nas
            transações quando fizer as compras.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {days.map((day) => (
            <section
              key={day.dayOfWeek}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <h3 className="mb-3 font-semibold text-gray-800 dark:text-white">
                {DAYS[day.dayOfWeek]}
              </h3>
              <div className="space-y-2">
                {SLOTS.map(([slot, label]) => (
                  <label key={slot} className="block">
                    <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                      {label}
                    </span>
                    <input
                      value={day[slot] ?? ''}
                      onChange={(event) => updateMeal(day.dayOfWeek, slot, event.target.value)}
                      placeholder={`Ex.: ${slot === 'lunch' ? 'arroz e frango' : 'omelete'}`}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:text-white"
                    />
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[180px_1fr]">
          <label>
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Orçamento semanal
            </span>
            <MoneyInput value={budget} onChange={setBudget} currencySymbol={currencySymbol} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Observações
            </span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: preparar duas porções no domingo"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:text-white"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Lista de compras (opcional)
          </span>
          <textarea
            value={shopping}
            onChange={(event) => setShopping(event.target.value)}
            rows={5}
            placeholder={
              'Um item por linha: nome | quantidade | unidade | preço\nFrango | 2 | kg | 12,50'
            }
            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:text-white"
          />
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            O preço é o total estimado do item; poderá ajustar o valor pago antes de registrar.
          </span>
        </label>

        {error && <p className="mt-3 text-sm text-error-600 dark:text-error-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="button" onClick={submit} disabled={saving}>
            {saving ? 'A criar...' : 'Criar plano'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
