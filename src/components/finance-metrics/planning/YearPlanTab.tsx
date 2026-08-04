import { useEffect, useState } from 'react';
import { Surface } from '../../common/PageShell';
import Button from '../../ui/button/Button';
import { Modal } from '../../ui/modal';
import { useConfirm } from '../../ui/confirm/useConfirm';
import Label from '../../form/Label';
import CategorySelect from '../../form/CategorySelect';
import MoneyInput from '../../form/MoneyInput';
import MixedCurrencyWarning from '../../common/MixedCurrencyWarning';
import { currencyOption, formatMoney } from '../../../utils/currency';
import type { FlowType, YearPlan } from '../../../hooks/usePlanning';

interface Props {
  yearPlan: YearPlan | null;
  year: number;
  isLoading: boolean;
  isSaving: boolean;
  onChangeYear: (year: number) => void;
  onSave: (
    year: number,
    items: { categoryId: number; type: FlowType; plannedAmount: number }[],
  ) => Promise<unknown>;
  onDeleteItem: (year: number, categoryId: number) => Promise<unknown>;
}

/**
 * Quanto se pretende gastar/receber em cada categoria, ano a ano.
 *
 * O que se escreve aqui **manda sobre a média histórica** na projeção daquele
 * ano — é a diferença entre prever e decidir. Ao lado fica o realizado e o que
 * a média diria, para o número escrito não ser um palpite às cegas.
 */
export default function YearPlanTab({
  yearPlan,
  year,
  isLoading,
  isSaving,
  onChangeYear,
  onSave,
  onDeleteItem,
}: Props) {
  const { confirm, dialog } = useConfirm();
  const [isOpen, setIsOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [type, setType] = useState<FlowType>('expense');
  const [amount, setAmount] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCategoryId(undefined);
      setAmount(0);
      setFormError(null);
    }
  }, [isOpen]);

  const currency = yearPlan?.displayCurrency;
  const money = (v: number) => formatMoney(v, currency);
  const symbol = currencyOption(currency).symbol;
  const currentYear = new Date().getFullYear();

  const submit = async () => {
    if (!categoryId) {
      setFormError('Escolha uma categoria.');
      return;
    }
    if (amount < 0) {
      setFormError('O valor não pode ser negativo.');
      return;
    }
    try {
      await onSave(year, [{ categoryId, type, plannedAmount: amount }]);
      setIsOpen(false);
    } catch {
      setFormError('Não foi possível gravar o plano.');
    }
  };

  const remove = async (item: { categoryId: number; categoryName: string }) => {
    const ok = await confirm({
      title: 'Remover do plano',
      message: `"${item.categoryName}" deixa de ter valor planeado em ${year}. A projeção volta a usar a média histórica.`,
      danger: true,
      confirmText: 'Remover',
    });
    if (ok) {
      await onDeleteItem(year, item.categoryId);
      onChangeYear(year); // recarrega
    }
  };

  const planned = yearPlan?.items.filter((i) => i.plannedAmount != null) ?? [];
  const unplanned = yearPlan?.items.filter((i) => i.plannedAmount == null) ?? [];
  const isPastOrCurrent = year <= currentYear;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeYear(year - 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            ←
          </button>
          <span className="font-display text-lg font-semibold text-gray-900 dark:text-white">
            {year}
          </span>
          <button
            type="button"
            onClick={() => onChangeYear(year + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            →
          </button>
        </div>
        <Button size="sm" type="button" onClick={() => setIsOpen(true)}>
          Planear categoria
        </Button>
      </div>

      {yearPlan && <MixedCurrencyWarning currencies={yearPlan.unconvertedCurrencies} />}

      {yearPlan && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Surface className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Receita planeada
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-gray-900 dark:text-white">
              {money(yearPlan.totals.plannedIncome)}
            </p>
          </Surface>
          <Surface className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Despesa planeada
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-gray-900 dark:text-white">
              {money(yearPlan.totals.plannedExpense)}
            </p>
          </Surface>
          <Surface className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Sobra planeada
            </p>
            <p
              className={`mt-1 font-display text-lg font-semibold ${
                yearPlan.totals.plannedIncome - yearPlan.totals.plannedExpense >= 0
                  ? 'text-success-600 dark:text-success-400'
                  : 'text-error-500 dark:text-error-400'
              }`}
            >
              {money(yearPlan.totals.plannedIncome - yearPlan.totals.plannedExpense)}
            </p>
          </Surface>
          <Surface className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {isPastOrCurrent ? 'Realizado (sobra)' : 'Pela média histórica'}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-gray-900 dark:text-white">
              {isPastOrCurrent
                ? money(
                    yearPlan.totals.realizedIncome - yearPlan.totals.realizedExpense,
                  )
                : money(
                    yearPlan.totals.baselineIncome - yearPlan.totals.baselineExpense,
                  )}
            </p>
          </Surface>
        </div>
      )}

      {isLoading && !yearPlan && (
        <Surface className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          A carregar...
        </Surface>
      )}

      {yearPlan && planned.length === 0 && (
        <Surface className="p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nada planeado para {year}. Sem plano, a projeção usa a média dos últimos 12
            meses para cada categoria.
          </p>
        </Surface>
      )}

      {planned.length > 0 && (
        <Surface className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium">Planeado</th>
                  <th className="px-4 py-3 text-right font-medium">Por mês</th>
                  <th className="px-4 py-3 text-right font-medium">Realizado</th>
                  <th className="px-4 py-3 text-right font-medium">Média histórica</th>
                  <th className="px-4 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {planned.map((item) => {
                  // Numa despesa, gastar acima do planeado é mau; numa receita,
                  // receber acima é bom. O mesmo sinal não pode ter a mesma cor.
                  const over = (item.difference ?? 0) > 0;
                  const bad = item.type === 'expense' ? over : !over && item.realizedAmount > 0;

                  return (
                    <tr
                      key={`${item.categoryId}-${item.type}`}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.categoryName}
                        </span>
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                            item.type === 'income'
                              ? 'bg-success-500/15 text-success-600 dark:text-success-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400'
                          }`}
                        >
                          {item.type === 'income' ? 'receita' : 'despesa'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {money(item.plannedAmount ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                        {money(item.monthlyPlanned ?? 0)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          isPastOrCurrent && item.realizedAmount > 0 && bad
                            ? 'text-error-500 dark:text-error-400'
                            : ''
                        }`}
                      >
                        {money(item.realizedAmount)}
                        {isPastOrCurrent && item.progressPct != null && (
                          <span className="ml-1 text-xs text-gray-400">
                            ({Math.round(item.progressPct)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                        {money(item.baselineAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => remove(item)}
                          className="text-xs text-gray-500 hover:text-error-500 dark:text-gray-400"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {unplanned.length > 0 && (
        <Surface className="p-4 sm:p-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Sem plano para {year}
          </h4>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Estas categorias seguem a média histórica na projeção.
          </p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {unplanned.map((item) => (
              <li
                key={`${item.categoryId}-${item.type}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="truncate text-gray-700 dark:text-gray-300">
                  {item.categoryName}
                </span>
                <span className="shrink-0 text-gray-500 dark:text-gray-400">
                  {money(isPastOrCurrent ? item.realizedAmount : item.baselineAmount)}
                </span>
              </li>
            ))}
          </ul>
        </Surface>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-md">
        <div className="p-6">
          <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
            Planear categoria em {year}
          </h3>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="plan-type">Entra ou sai</Label>
              <select
                id="plan-type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as FlowType);
                  setCategoryId(undefined);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="expense">Sai (despesa)</option>
                <option value="income">Entra (receita)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="plan-category">Categoria</Label>
              <CategorySelect
                id="plan-category"
                value={categoryId}
                type={type}
                onChange={setCategoryId}
              />
            </div>

            <div>
              <Label htmlFor="plan-amount">Total do ano</Label>
              <MoneyInput
                id="plan-amount"
                value={amount}
                currencySymbol={symbol}
                onChange={setAmount}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {amount > 0 && `${money(amount / 12)} por mês. `}
                Este valor substitui a média histórica na projeção deste ano.
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
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" type="button" disabled={isSaving} onClick={submit}>
              {isSaving ? 'A gravar...' : 'Gravar'}
            </Button>
          </div>
        </div>
      </Modal>

      {dialog}
    </div>
  );
}
