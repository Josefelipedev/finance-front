import { Link } from 'react-router';
import { BillsForecast } from '../../../hooks/useBills';
import { formatMoney } from '../../../utils/currency';
import { Surface } from '../../common/PageShell';
import MixedCurrencyWarning from '../../common/MixedCurrencyWarning';

interface Props {
  /** `null` num mês já fechado — a previsão parte do saldo de hoje. */
  forecast?: BillsForecast | null;
  /** Só para saber a quem pertence cada conta sem repetir o próprio nome. */
  currentUserId?: number | null;
}

/**
 * O que fica em cada conta bancária depois de pagar o que falta.
 *
 * Os totais do mês respondem "sobra dinheiro?" para o casal inteiro — e num
 * casal com contas separadas essa resposta não chega para nada: saber que
 * sobram 900 € não diz em que conta é que eles estão, nem qual dos dois vai
 * ficar apertado no dia 28.
 *
 * Cada cartão mostra a conta inteira, na moeda da própria conta:
 *
 *     hoje 1.240,00 € + a receber 1.824,32 € − a pagar 1.410,55 € = 1.653,77 €
 *
 * O "hoje" é o saldo derivado da conta (ponto de partida + lançamentos), e por
 * isso as contas já pagas não aparecem nas duas linhas do meio — já lá estão
 * dentro. As atrasadas de meses anteriores aparecem: ainda não saíram.
 */
export default function AccountForecastCards({ forecast, currentUserId }: Props) {
  if (!forecast) return null;

  const { items, unassigned } = forecast;
  const semAtribuicao = unassigned.count > 0;
  const semTaxa = forecast.unconvertedCurrencies ?? [];

  // Cada cartão soma contas de várias moedas na moeda da conta bancária. Sem
  // taxa, essa soma junta valores de face — e "sobram 1.653,77 €" passa a ser
  // um número plausível e errado, que é o que estes cartões existem para evitar.
  if (semTaxa.length > 0) return <MixedCurrencyWarning currencies={semTaxa} />;

  // Sem contas bancárias registadas não há previsão possível — e um vazio mudo
  // deixava a pergunta ("quanto me fica na conta?") sem resposta nem caminho.
  if (items.length === 0) {
    return semAtribuicao ? (
      <Surface className="p-5">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Para ver o que sobra em cada conta ao fim do mês, registe as suas contas bancárias e
          diga de qual sai cada despesa.
        </p>
        <Link
          to="/contas"
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          <i className="fas fa-building-columns text-xs"></i>
          Registar conta bancária
        </Link>
      </Surface>
    ) : null;
  }

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <i className="fas fa-building-columns text-xs text-gray-400 dark:text-gray-500"></i>
        O que fica em cada conta
        <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
          depois de pagar o que falta
        </span>
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => {
          const negativo = a.projectedBalance < 0;
          const encolhe = a.projectedBalance < a.currentBalance;
          return (
            <Surface key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {a.bankName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                    {a.ownerName && a.ownerId !== currentUserId ? `${a.ownerName} · ` : ''}
                    {a.currency}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    negativo
                      ? 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
                      : encolhe
                        ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400'
                        : 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                  }`}
                  title={
                    negativo
                      ? 'O que está por pagar é mais do que há na conta'
                      : `${a.billCount} conta(s) por liquidar`
                  }
                >
                  {negativo ? 'não chega' : `${a.billCount} por liquidar`}
                </span>
              </div>

              <p
                className={`mt-3 font-display text-2xl font-semibold tabular-nums ${
                  negativo
                    ? 'text-error-500 dark:text-error-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {formatMoney(a.projectedBalance, a.currency)}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                fica no fim, se tudo for pago
              </p>

              <dl className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-xs dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Hoje</dt>
                  <dd className="tabular-nums font-medium text-gray-700 dark:text-gray-200">
                    {formatMoney(a.currentBalance, a.currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Ainda entra</dt>
                  <dd className="tabular-nums font-medium text-success-600 dark:text-success-400">
                    +{formatMoney(a.incoming, a.currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Ainda sai</dt>
                  <dd className="tabular-nums font-medium text-error-500 dark:text-error-400">
                    −{formatMoney(a.outgoing, a.currency)}
                  </dd>
                </div>
              </dl>
            </Surface>
          );
        })}
      </div>

      {/* O dinheiro que ninguém disse de onde sai não se reparte pelas contas —
          calá-lo era deixar os cartões acima parecerem a história toda. */}
      {semAtribuicao && (
        <p className="mt-2 px-1 text-xs text-gray-500 dark:text-gray-400">
          <i className="fas fa-circle-info mr-1.5 text-[10px] text-warning-500"></i>
          {unassigned.count} {unassigned.count === 1 ? 'conta ainda não diz' : 'contas ainda não dizem'} de que
          conta bancária {unassigned.count === 1 ? 'sai' : 'saem'} (
          {formatMoney(unassigned.outgoing, unassigned.currency)} a pagar
          {unassigned.incoming > 0 &&
            `, ${formatMoney(unassigned.incoming, unassigned.currency)} a receber`}
          ) — {unassigned.count === 1 ? 'não entra' : 'não entram'} nas previsões acima.
        </p>
      )}
    </div>
  );
}
