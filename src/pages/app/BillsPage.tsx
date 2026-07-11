import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import PageShell, { Surface } from '../../components/common/PageShell';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/button/Button';
import { useBills, BillItem } from '../../hooks/useBills';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { convertAmount, formatMoney } from '../../utils/currency';

// ===== Helpers de mês / data =====

/** Mês atual como "YYYY-MM". */
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Desloca um "YYYY-MM" em `delta` meses. */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "julho de 2026" (pt-BR). */
function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

/** "dd/MM" (pt-BR) a partir de uma ISO date. */
function formatDueDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export default function BillsPage() {
  const [month, setMonth] = useState<string>(currentMonth());
  const [items, setItems] = useState<BillItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { getBills, payBill, unpayBill } = useBills();
  const { profile, getProfile } = useUserProfile();
  const rates = useExchangeRates();

  const displayCurrency = profile?.currency ?? 'BRL';

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  const load = useCallback(
    async (targetMonth: string) => {
      setIsFetching(true);
      setError(null);
      try {
        const res = await getBills(targetMonth);
        setItems(res?.items ?? []);
      } catch (err) {
        setError((err as Error).message || 'Não foi possível carregar as contas.');
      } finally {
        setIsFetching(false);
      }
    },
    [getBills],
  );

  useEffect(() => {
    load(month);
  }, [load, month]);

  // ===== Totais convertidos para a moeda de exibição do perfil =====
  const { pendingTotal, paidTotal } = useMemo(() => {
    let pending = 0;
    let paid = 0;
    for (const item of items) {
      const value = convertAmount(item.amount, item.currency, displayCurrency, rates);
      if (item.status === 'paid') paid += value;
      else pending += value;
    }
    return { pendingTotal: pending, paidTotal: paid };
  }, [items, displayCurrency, rates]);

  const handleToggle = async (item: BillItem) => {
    if (togglingId != null) return;
    setTogglingId(item.id);
    try {
      if (item.status === 'paid') {
        await unpayBill(item.id);
        toast.success('Conta marcada como pendente.');
      } else {
        await payBill(item.id);
        toast.success('Conta marcada como paga!');
      }
      await load(month);
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível atualizar a conta.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <PageShell
      title="Contas a Pagar"
      description="Acompanhe o que vence no mês e marque o que já foi pago."
      actions={
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-white/[0.08] dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="Mês anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <i className="fas fa-chevron-left text-sm"></i>
          </button>
          <span className="min-w-[9rem] text-center text-sm font-semibold capitalize text-gray-900 dark:text-white">
            {formatMonthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            aria-label="Próximo mês"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <i className="fas fa-chevron-right text-sm"></i>
          </button>
        </div>
      }
    >
      {/* Resumo do mês */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Surface className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Pendente
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-error-500 dark:text-error-400">
            {formatMoney(pendingTotal, displayCurrency)}
          </p>
        </Surface>
        <Surface className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Pago
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-success-600 dark:text-success-400">
            {formatMoney(paidTotal, displayCurrency)}
          </p>
        </Surface>
      </div>

      {/* Lista de contas */}
      {isFetching ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" color="brand" message="A carregar contas…" />
        </div>
      ) : error ? (
        <Surface className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-error-50 text-xl text-error-500 dark:bg-error-500/10 dark:text-error-400">
            <i className="fas fa-triangle-exclamation"></i>
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-gray-900 dark:text-white">
            Algo correu mal
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <div className="mt-5 flex justify-center">
            <Button size="sm" variant="primary" type="button" onClick={() => load(month)}>
              <i className="fas fa-rotate-right text-xs"></i>
              Tentar de novo
            </Button>
          </div>
        </Surface>
      ) : items.length === 0 ? (
        <Surface className="p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-xl text-brand-600 dark:bg-brand-400/10 dark:text-brand-400">
            <i className="fas fa-file-invoice-dollar"></i>
          </span>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Nenhuma conta neste mês.</p>
        </Surface>
      ) : (
        <Surface className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {items.map((item) => {
            const isPaid = item.status === 'paid';
            const isOverdue = item.overdue;
            const isToggling = togglingId === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-4 sm:gap-4 sm:p-5 ${
                  isOverdue ? 'bg-error-50/40 dark:bg-error-500/[0.06]' : ''
                }`}
              >
                {/* Toggle "Pago" */}
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  disabled={isToggling}
                  aria-label={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                  aria-pressed={isPaid}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isPaid
                      ? 'border-success-500 bg-success-500 text-white'
                      : isOverdue
                        ? 'border-error-400 text-transparent hover:border-error-500 dark:border-error-500/60'
                        : 'border-gray-300 text-transparent hover:border-brand-400 dark:border-white/20'
                  }`}
                >
                  {isToggling ? (
                    <i className="fas fa-spinner fa-spin text-[11px] text-gray-400"></i>
                  ) : (
                    <i className="fas fa-check text-[11px]"></i>
                  )}
                </button>

                {/* Descrição + metadados */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`truncate font-medium ${
                        isPaid
                          ? 'text-gray-400 line-through dark:text-gray-500'
                          : isOverdue
                            ? 'text-error-600 dark:text-error-400'
                            : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.description}
                    </p>
                    {isOverdue && (
                      <span className="inline-flex items-center rounded-md border border-error-200 bg-error-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                        Em atraso
                      </span>
                    )}
                    {item.carriedOver && (
                      <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-400">
                        Mês anterior
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <i className="fas fa-calendar-day text-[10px] text-gray-400 dark:text-gray-500"></i>
                      {formatDueDate(item.dueDate)}
                    </span>
                    {item.categoryName && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.categoryColor ?? '#9ca3af' }}
                        ></span>
                        {item.categoryName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Valor na moeda nativa */}
                <div className="shrink-0 text-right">
                  <p
                    className={`font-display font-semibold tabular-nums ${
                      isPaid
                        ? 'text-gray-400 line-through dark:text-gray-500'
                        : isOverdue
                          ? 'text-error-600 dark:text-error-400'
                          : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatMoney(item.amount, item.currency)}
                  </p>
                  {isPaid && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-success-600 dark:text-success-400">
                      <i className="fas fa-check text-[10px]"></i>
                      Pago
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </Surface>
      )}
    </PageShell>
  );
}
