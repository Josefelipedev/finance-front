import { useEffect, useState } from 'react';
import { Surface } from '../../common/PageShell';
import MixedCurrencyWarning from '../../common/MixedCurrencyWarning';
import Button from '../../ui/button/Button';
import MoneyInput from '../../form/MoneyInput';
import { currencyOption, formatMoney } from '../../../utils/currency';
import { monthLabel } from '../../../utils/month';
import type { PayoffPlan, PayoffStrategy } from '../../../hooks/useDebts';
import { monthsLabel } from './kinds';

interface Props {
  plan: PayoffPlan;
  isSaving?: boolean;
  onSave: (input: { strategy?: PayoffStrategy; extraMonthly?: number | null }) => Promise<unknown>;
}

const ESTRATEGIAS: { key: PayoffStrategy; name: string; description: string }[] = [
  {
    key: 'SNOWBALL',
    name: 'Bola de neve',
    description:
      'A dívida mais pequena primeiro. Custa mais juro e dá a primeira vitória mais cedo.',
  },
  {
    key: 'AVALANCHE',
    name: 'Avalanche',
    description: 'O juro mais alto primeiro. É a que custa menos dinheiro no total.',
  },
  {
    key: 'CUSTOM',
    name: 'A minha ordem',
    description: 'A fila que escreveste à mão em cada dívida.',
  },
];

/**
 * A curva do que se deve, mês a mês.
 *
 * Uma data de libertação é um número; a curva é a forma dela — e é onde se vê
 * o efeito da bola de neve, que acelera à medida que as dívidas caem em vez de
 * descer em linha recta.
 */
function BalanceCurve({
  schedule,
  money,
}: {
  schedule: PayoffPlan['schedule'];
  money: (v: number) => string;
}) {
  if (schedule.length < 2) return null;
  const peak = Math.max(...schedule.map((m) => m.balance), 1);

  return (
    <div className="flex items-end gap-px overflow-x-auto pb-1">
      {schedule.map((m) => (
        <div
          key={m.month}
          className="min-w-[3px] flex-1"
          title={`Mês ${m.month}: deve-se ${money(m.balance)}`}
        >
          <div className="flex h-20 items-end">
            <div
              className={`w-full rounded-t ${
                m.clearedDebtIds.length > 0 ? 'bg-success-500' : 'bg-brand-400/70'
              }`}
              style={{ height: `${Math.max(2, (m.balance / peak) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Uma linha da conta da sobra: o rótulo à esquerda, o dinheiro à direita. */
function Linha({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: string;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt
        className={
          strong
            ? 'text-sm font-medium text-gray-900 dark:text-white'
            : 'text-sm text-gray-600 dark:text-gray-400'
        }
      >
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          negative
            ? 'font-semibold text-error-600 dark:text-error-400'
            : strong
              ? 'font-semibold text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function PayoffPlanCard({ plan, isSaving, onSave }: Props) {
  const [extra, setExtra] = useState(plan.extraMonthly);
  const money = (v: number) => formatMoney(v, plan.displayCurrency);
  const symbol = currencyOption(plan.displayCurrency).symbol;

  // O campo é de quem escreve enquanto está a escrever; quando o plano muda por
  // outra via (importar uma dívida, o cônjuge mexer), acompanha.
  useEffect(() => setExtra(plan.extraMonthly), [plan.extraMonthly]);

  const { comparison } = plan;
  const afford = plan.affordability;
  const alternativa = plan.strategy === 'AVALANCHE' ? comparison.snowball : comparison.avalanche;

  return (
    <Surface className="p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
          O plano
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {money(plan.totalBalance)} em dívida
        </span>
      </div>

      {plan.unconvertedCurrencies.length > 0 ? (
        <div className="mt-4">
          <MixedCurrencyWarning currencies={plan.unconvertedCurrencies} rateDate={plan.rateDate} />
        </div>
      ) : null}

      {/* ── A resposta ────────────────────────────────────────────────── */}
      <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
        {plan.totalBalance <= 0.005 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma dívida activa. Não há plano a fazer — e isso é a melhor resposta que este ecrã
            pode dar.
          </p>
        ) : !plan.feasible ? (
          <p className="text-sm text-error-600 dark:text-error-400">
            <strong>Assim isto não fecha.</strong> Os {money(plan.monthlyBudget)} por mês não chegam
            para o juro que corre — o saldo cresce todos os meses. Subir o extra, baixar o juro
            (renegociar) ou consolidar são as três saídas; mostrar-te uma data seria mentir.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ficas livre em</p>
            <p className="font-display text-2xl font-semibold text-gray-900 dark:text-white">
              {plan.freeOn ? monthLabel(plan.freeOn) : '—'}
              <span className="ml-2 text-base font-normal text-gray-500 dark:text-gray-400">
                ({monthsLabel(plan.months)})
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              A pagar{' '}
              <strong className="text-gray-900 dark:text-white">{money(plan.monthlyBudget)}</strong>{' '}
              por mês ({money(plan.totalMinimum)} de mínimos
              {plan.extraMonthly > 0.005 && ` + ${money(plan.extraMonthly)} de extra`}). Vais
              entregar {money(plan.totalPaid)} ao todo, dos quais{' '}
              <strong className="text-gray-900 dark:text-white">{money(plan.totalInterest)}</strong>{' '}
              são só juro.
            </p>
          </>
        )}
      </div>

      {/* ── De onde vem a sobra ───────────────────────────────────────── */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          O que sobra por mês, além dos mínimos
        </p>

        {afford.monthsCovered === 0 ? (
          <p className="rounded-lg bg-warning-50 px-3 py-2.5 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            Ainda não há lançamentos que cheguem para saber quanto te sobra. Escreve o extra à mão
            por agora — assim que houver um mês de movimento, a app passa a propor o número.
          </p>
        ) : (
          <>
            {/*
              As linhas existem para o número não cair do céu. "Sobram-te 240 €"
              só se acredita a ver que são o salário menos as contas, a comida e
              o resto — e é a ver as linhas que alguém descobre onde apertar.
            */}
            <dl className="space-y-1 text-sm">
              <Linha label="Entra por mês" value={money(afford.income)} />
              <Linha label="Contas e prestações" value={`− ${money(afford.bills)}`} />
              <Linha label="Alimentação" value={`− ${money(afford.food)}`} />
              <Linha label="Tudo o resto" value={`− ${money(afford.other)}`} />
              <Linha label="Mínimos das dívidas" value={`− ${money(afford.minimums)}`} />
              <div className="!mt-2 border-t border-gray-100 pt-2 dark:border-white/[0.06]">
                <Linha
                  label="Sobra"
                  value={money(afford.leftover)}
                  strong
                  negative={afford.leftover < -0.005}
                />
              </div>
            </dl>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Média dos últimos {afford.monthsCovered}{' '}
              {afford.monthsCovered === 1 ? 'mês' : 'meses'}.
              {afford.debtPayments > 0.005 && (
                <>
                  {' '}
                  Já entregas {money(afford.debtPayments)}/mês às dívidas — isso não desconta aqui,
                  porque os mínimos já estão contados em cima.
                </>
              )}
            </p>
            {afford.leftover < -0.005 && (
              <p className="mt-2 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                <strong>Sai mais do que entra.</strong> Antes de acelerar a dívida, o que este plano
                precisa é de {money(Math.abs(afford.leftover))} por mês que hoje não existem.
              </p>
            )}
          </>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="w-40">
            <MoneyInput value={extra} onChange={setExtra} currencySymbol={symbol} />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={isSaving || Math.abs(extra - plan.extraMonthly) < 0.005}
            onClick={() => void onSave({ extraMonthly: extra })}
          >
            Recalcular
          </Button>
          {/*
            Uma proposta que não se pode recusar deixa de ser proposta: quem
            apertou (ou aliviou) o que a app sugeriu tem de conseguir voltar
            atrás sem adivinhar qual era o número.
          */}
          {!plan.extraIsAuto && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void onSave({ extraMonthly: null })}
              className="text-sm font-medium text-brand-500 hover:text-brand-600 disabled:opacity-60 dark:text-brand-400"
            >
              Voltar ao que a app calcula ({money(afford.suggestedExtra)})
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {plan.extraIsAuto
            ? 'Este número é o que a app calculou que te sobra. Escreve outro por cima se quiseres apertar mais — ou menos.'
            : 'Escrito à mão — manda sobre o que a app calculou.'}
        </p>
        {comparison.monthsSavedByExtra != null && comparison.monthsSavedByExtra > 0 && (
          <p className="mt-2 text-sm text-success-600 dark:text-success-400">
            Este extra corta <strong>{monthsLabel(comparison.monthsSavedByExtra)}</strong>
            {comparison.interestSavedByExtra != null &&
              comparison.interestSavedByExtra > 0.005 &&
              ` e poupa ${money(comparison.interestSavedByExtra)} de juro`}{' '}
            face a pagar só os mínimos.
          </p>
        )}
      </div>

      {/* ── A ordem ───────────────────────────────────────────────────── */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Por que ordem atacar
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ESTRATEGIAS.map((e) => (
            <button
              key={e.key}
              type="button"
              disabled={isSaving}
              onClick={() => void onSave({ strategy: e.key })}
              className={`rounded-xl border p-3 text-left transition-colors disabled:opacity-60 ${
                plan.strategy === e.key
                  ? 'border-brand-400 bg-brand-50 dark:border-brand-400/40 dark:bg-brand-400/[0.08]'
                  : 'border-gray-200 hover:border-gray-300 dark:border-white/[0.06] dark:hover:border-white/[0.12]'
              }`}
            >
              <span className="font-display text-sm font-semibold text-gray-900 dark:text-white">
                {e.name}
              </span>
              <span className="mt-1 block text-xs leading-snug text-gray-500 dark:text-gray-400">
                {e.description}
              </span>
            </button>
          ))}
        </div>

        {plan.strategy !== 'CUSTOM' &&
          plan.feasible &&
          comparison.avalancheSavesInterest > 0.005 && (
            <p className="mt-2.5 text-sm text-gray-600 dark:text-gray-400">
              {plan.strategy === 'SNOWBALL' ? (
                <>
                  A avalanche pouparia{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {money(comparison.avalancheSavesInterest)}
                  </strong>{' '}
                  de juro
                  {alternativa.months != null &&
                    plan.months != null &&
                    alternativa.months !== plan.months &&
                    ` e ${monthsLabel(Math.abs(plan.months - alternativa.months))}`}
                  . A bola de neve não é irracional por isso — é a que dá uma dívida fechada mais
                  cedo, e é isso que faz continuar.
                </>
              ) : (
                <>
                  Estás na ordem mais barata: poupa{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {money(comparison.avalancheSavesInterest)}
                  </strong>{' '}
                  de juro face à bola de neve.
                </>
              )}
            </p>
          )}
      </div>

      {/* ── A fila ────────────────────────────────────────────────────── */}
      {plan.queue.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
          <ol className="space-y-2">
            {plan.queue.map((q) => (
              <li key={q.debtId} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    q.position === 1
                      ? 'bg-brand-400 text-gray-950'
                      : 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400'
                  }`}
                >
                  {q.position}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{q.name}</span>
                <span className="tabular-nums text-gray-500 dark:text-gray-400">
                  {money(q.balance)}
                  {q.nativeCurrency !== plan.displayCurrency && (
                    <span className="ml-1 text-xs">
                      ({formatMoney(q.nativeBalance, q.nativeCurrency)})
                    </span>
                  )}
                  {q.annualInterestRate > 0 && ` · ${q.annualInterestRate}%`}
                </span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {q.freeOn ? `paga em ${monthLabel(q.freeOn)}` : 'não fecha'}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── A curva ───────────────────────────────────────────────────── */}
      {plan.feasible && plan.schedule.length > 1 && (
        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            O que se deve, mês a mês
          </p>
          <BalanceCurve schedule={plan.schedule} money={money} />
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            As barras verdes são os meses em que uma dívida desaparece.
          </p>
        </div>
      )}
    </Surface>
  );
}
