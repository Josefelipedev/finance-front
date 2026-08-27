import { BillsMonthlyForecast } from '../../../hooks/useBills';
import { formatMoney } from '../../../utils/currency';
import { monthLabel } from '../../../utils/month';
import { Surface } from '../../common/PageShell';

type Props = {
  forecast: BillsMonthlyForecast | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function MonthlyBillsForecast({ forecast, isLoading, error, onRetry }: Props) {
  const missing = forecast?.unconvertedCurrencies ?? [];
  const totalsAreSafe = missing.length === 0;

  return (
    <section aria-labelledby="next-months-title">
      <div className="mb-3 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
            Planeamento
          </p>
          <h2 id="next-months-title" className="font-display text-lg font-semibold text-gray-900 dark:text-white">
            Próximos meses
          </h2>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">Tudo o que o casal paga</span>
      </div>

      <Surface className="overflow-hidden">
        {isLoading ? (
          <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <i className="fas fa-spinner fa-spin text-brand-500"></i>
            A calcular os próximos 10 meses…
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            <button type="button" onClick={onRetry} className="mt-3 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Tentar outra vez
            </button>
          </div>
        ) : forecast ? (
          <>
            {!totalsAreSafe && (
              <div className="border-b border-warning-200 bg-warning-50 px-5 py-3 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400">
                <i className="fas fa-triangle-exclamation mr-2"></i>
                Falta câmbio para {missing.join(', ')}. Os totais e o mês mais pesado ficam ocultos para não misturar moedas.
              </div>
            )}

            <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-5 dark:divide-white/[0.06]">
              {forecast.months.map((item) => {
                const isHeaviest = totalsAreSafe && item.month === forecast.heaviest;
                return (
                  <div
                    key={item.month}
                    className={`relative min-h-24 p-4 ${
                      isHeaviest ? 'bg-error-50/70 dark:bg-error-500/[0.08]' : ''
                    }`}
                  >
                    <p className="text-xs font-medium capitalize text-gray-500 dark:text-gray-400">
                      {monthLabel(item.month)}
                    </p>
                    <p className="mt-2 font-display text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                      {totalsAreSafe ? formatMoney(item.expense, forecast.displayCurrency) : '—'}
                    </p>
                    {isHeaviest && (
                      <span className="mt-1 inline-flex rounded-full bg-error-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-error-600 dark:bg-error-500/20 dark:text-error-400">
                        Mais pesado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {totalsAreSafe && (forecast.heaviest || forecast.relief) && (
              <div className="flex flex-col gap-1 border-t border-gray-100 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:gap-5 dark:border-white/[0.06] dark:text-gray-300">
                {forecast.heaviest && (
                  <span>
                    <strong className="font-semibold text-gray-900 dark:text-white">
                      {monthLabel(forecast.heaviest)}
                    </strong>{' '}
                    é o mês mais pesado.
                  </span>
                )}
                {forecast.relief && (
                  <span>
                    A despesa alivia de forma sustentada a partir de{' '}
                    <strong className="font-semibold text-success-600 dark:text-success-400">
                      {monthLabel(forecast.relief)}
                    </strong>
                    .
                  </span>
                )}
              </div>
            )}
          </>
        ) : null}
      </Surface>
    </section>
  );
}
