import { useMemo } from 'react';
import { RecurringTransaction } from '../../../hooks/useRecurringFinance';
import { useExchangeRatesState } from '../../../hooks/useExchangeRates';
import { convertAmount, formatMoney, unconvertibleCurrencies } from '../../../utils/currency';
import { isFinished, monthlyEquivalent, remainingTotal } from '../../../utils/recurring';
import { Surface } from '../../common/PageShell';
import MixedCurrencyWarning from '../../common/MixedCurrencyWarning';

interface Props {
  transactions: RecurringTransaction[];
  /** Moeda em que os totais são apresentados (a do perfil). */
  displayCurrency: string;
}

/**
 * O que as recorrentes custam, somado.
 *
 * A lista mostrava parcela a parcela e deixava a conta mais importante para a
 * cabeça de quem lê: quanto é que isto tudo leva por mês, e quanto falta pagar
 * até ao fim dos contratos. São dois números diferentes — o mensal é o que
 * aperta o orçamento agora, o "falta pagar" é a dívida que ainda existe — e
 * por isso aparecem os dois.
 *
 * As recorrentes já terminadas ficam de fora: um financiamento pago não é
 * compromisso nenhum, e mantê-lo no total mensal fazia a app pedir dinheiro
 * que já ninguém deve.
 */
export default function RecurringSummary({ transactions, displayCurrency }: Props) {
  const { rates, status: ratesStatus } = useExchangeRatesState();

  const ativas = useMemo(() => transactions.filter((t) => !isFinished(t)), [transactions]);

  // Tudo na moeda de exibição não precisa de taxa nenhuma. Sem isto, quem só
  // usa uma moeda via um "a carregar as taxas de câmbio…" a piscar por nada.
  const precisaTaxas = useMemo(
    () => ativas.some((t) => (t.currency || displayCurrency) !== displayCurrency),
    [ativas, displayCurrency]
  );

  // Moedas que não dá para converter: somar sem taxa dá um total plausível e
  // errado (medido em produção: 5.345,29 € onde eram 919,10 €).
  const semTaxa = useMemo(
    () =>
      !precisaTaxas || ratesStatus === 'loading'
        ? []
        : unconvertibleCurrencies(
            ativas.map((t) => t.currency),
            displayCurrency,
            rates
          ),
    [ativas, displayCurrency, rates, ratesStatus, precisaTaxas]
  );

  const totais = useMemo(() => {
    const emMoeda = (valor: number, de: string) =>
      convertAmount(valor, de, displayCurrency, rates);

    let despesaMes = 0;
    let receitaMes = 0;
    let falta = 0;
    let contratado = 0;
    let pago = 0;
    let parcelamentos = 0;
    let semFim = 0;

    for (const t of ativas) {
      const mensal = emMoeda(monthlyEquivalent(t.frequency, t.amount), t.currency);
      if (t.type === 'income') receitaMes += mensal;
      else despesaMes += mensal;

      if (t.type !== 'expense') continue;

      const resto = remainingTotal(t);
      if (resto == null) {
        // Assinatura sem fim: não há total a somar, mas há que dizer que
        // existe — senão o "falta pagar" parece o compromisso todo.
        semFim += 1;
        continue;
      }
      parcelamentos += 1;
      falta += emMoeda(resto, t.currency);
      contratado += emMoeda(t.contractedTotal ?? 0, t.currency);
      pago += emMoeda(t.paidTotal ?? 0, t.currency);
    }

    return {
      despesaMes,
      receitaMes,
      sobraMes: receitaMes - despesaMes,
      falta,
      contratado,
      pago,
      parcelamentos,
      semFim,
    };
  }, [ativas, displayCurrency, rates]);

  if (transactions.length === 0) return null;

  if (precisaTaxas && ratesStatus === 'loading') {
    return (
      <Surface className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        A carregar as taxas de câmbio…
      </Surface>
    );
  }

  if (semTaxa.length > 0) return <MixedCurrencyWarning currencies={semTaxa} />;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Surface className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Despesa por mês
        </p>
        <p className="mt-1 font-display text-xl font-semibold tabular-nums text-error-500 dark:text-error-400">
          {formatMoney(totais.despesaMes, displayCurrency)}
        </p>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          {ativas.filter((t) => t.type !== 'income').length} recorrentes ativas
        </p>
      </Surface>

      <Surface className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Receita por mês
        </p>
        <p className="mt-1 font-display text-xl font-semibold tabular-nums text-success-600 dark:text-success-400">
          {formatMoney(totais.receitaMes, displayCurrency)}
        </p>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          {ativas.filter((t) => t.type === 'income').length} recorrentes ativas
        </p>
      </Surface>

      <Surface className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Sobra por mês
        </p>
        <p
          className={`mt-1 font-display text-xl font-semibold tabular-nums ${
            totais.sobraMes < 0
              ? 'text-error-500 dark:text-error-400'
              : 'text-success-600 dark:text-success-400'
          }`}
        >
          {formatMoney(totais.sobraMes, displayCurrency)}
        </p>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          o que fica depois das recorrentes
        </p>
      </Surface>

      <Surface className="p-4">
        <p
          className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500"
          title="Soma do que ainda falta pagar nos parcelamentos com total contratado"
        >
          Falta pagar
        </p>
        <p className="mt-1 font-display text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
          {totais.parcelamentos > 0 ? formatMoney(totais.falta, displayCurrency) : '—'}
        </p>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          {totais.parcelamentos > 0 ? (
            <>
              {formatMoney(totais.pago, displayCurrency)} de{' '}
              {formatMoney(totais.contratado, displayCurrency)} pagos
              {totais.semFim > 0 && ` · ${totais.semFim} sem fim definido`}
            </>
          ) : totais.semFim > 0 ? (
            `${totais.semFim} sem fim definido — não há total a fechar`
          ) : (
            'nenhum parcelamento em curso'
          )}
        </p>
      </Surface>
    </div>
  );
}
