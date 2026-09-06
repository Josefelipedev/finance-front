import { useEffect } from 'react';
import { Link } from 'react-router';
import { Surface } from '../../common/PageShell';
import { formatMoney } from '../../../utils/currency';
import { useRules } from '../../../hooks/useRules';
import { BUCKETS, BUCKET_BAR, BUCKET_LABEL } from './buckets';
import { StatusBadge } from './RulesList';

/**
 * As regras, em quatro números, na primeira página.
 *
 * O ecrã das regras vive no Orçamento e responde por inteiro; este cartão só
 * responde a "está tudo bem?" e leva lá quem quiser saber mais. É a ligação
 * que faltava — sem ela, a regra era uma coisa que só existia para quem se
 * lembrasse de a ir ver.
 *
 * Mostra a **pior** regra e não a primeira: um cartão que dissesse "reserva de
 * emergência: cumprida" enquanto os desejos estão 40% acima do alvo estaria a
 * mentir por omissão.
 */
export default function RulesCard() {
  const { summary, loadSummary } = useRules();

  useEffect(() => {
    loadSummary().catch(() => {});
  }, [loadSummary]);

  if (!summary) return null;

  const money = (v: number) => formatMoney(v, summary.displayCurrency);
  const { verdict } = summary;

  return (
    <Surface className="flex flex-col p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
          A tua regra
        </h3>
        <Link
          to="/orcamento"
          className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          {summary.split.needsPct}/{summary.split.wantsPct}/{summary.split.savingsPct} →
        </Link>
      </div>

      {!verdict.hasIncome ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sem receita registada nos últimos meses fechados — a regra é uma proporção
          do que entra, e ainda não há de quê.
        </p>
      ) : (
        <div className="space-y-2.5">
          {verdict.buckets.map((b) => (
            <div key={b.bucket}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-300">
                  {BUCKET_LABEL[b.bucket]}
                </span>
                <span className="tabular-nums text-gray-500 dark:text-gray-400">
                  <strong className="font-semibold text-gray-900 dark:text-white">
                    {b.actualPct}%
                  </strong>
                  <span className="ml-1">de {b.targetPct}%</span>
                </span>
              </div>
              <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full ${BUCKET_BAR[b.bucket]}`}
                  style={{ width: `${Math.min(100, Math.max(0, b.actualPct ?? 0))}%` }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-gray-900/50 dark:bg-white/50"
                  style={{ left: `${Math.min(100, b.targetPct)}%` }}
                  aria-hidden
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* A pior das outras regras, quando há alguma. */}
      {summary.worst && (
        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-xs text-gray-600 first-letter:uppercase dark:text-gray-300">
              {summary.worst.label}
            </p>
            <StatusBadge status={summary.worst.status} />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {summary.worst.message}
          </p>
          {summary.total > 1 && (
            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              {summary.ok} de {summary.total} regras cumpridas.
            </p>
          )}
        </div>
      )}

      {/* Um veredicto incompleto tem de o dizer aqui também: quem só olha para
          o Dashboard nunca saberia que ele está a contar por alto. */}
      {summary.pendingCategories > 0 && (
        <Link
          to="/orcamento"
          className="mt-3 block rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/15"
        >
          {summary.pendingCategories}{' '}
          {summary.pendingCategories === 1 ? 'categoria' : 'categorias'} por confirmar —
          até lá estes números contam por alto.
        </Link>
      )}

      {verdict.hasIncome && verdict.leftover < -0.005 && (
        <p className="mt-3 rounded-lg bg-error-50 px-3 py-2 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-400">
          Sai mais do que entra: {money(Math.abs(verdict.leftover))} por mês.
        </p>
      )}
    </Surface>
  );
}
