import { useState } from 'react';
import { Surface } from '../../common/PageShell';
import MixedCurrencyWarning from '../../common/MixedCurrencyWarning';
import { formatMoney } from '../../../utils/currency';
import ProjectionChart from './ProjectionChart';
import { monthLabel } from '../../../utils/month';
import type { Projection } from '../../../hooks/usePlanning';

interface Props {
  projection: Projection;
}

function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'positive' | 'negative';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-success-600 dark:text-success-400'
      : tone === 'negative'
        ? 'text-error-500 dark:text-error-400'
        : 'text-gray-900 dark:text-white';

  return (
    <Surface className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`mt-1 font-display text-xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </Surface>
  );
}

/**
 * A projeção do cenário activo.
 *
 * O património ao fim do horizonte é o número que responde à pergunta "onde é
 * que isto vai dar?"; o resto do ecrã existe para se poder desconfiar dele —
 * de onde vem a média, o que é que já se sabe que vai acabar, e quanto tempo
 * de histórico é que a sustenta.
 */
export default function ProjectionTab({ projection }: Props) {
  const [showBaseline, setShowBaseline] = useState(false);
  const { summary, years, months, baseline, displayCurrency } = projection;
  const money = (v: number) => formatMoney(v, displayCurrency);

  const growth = summary.endBalance - summary.startBalance;
  const horizonEnd = months.length ? monthLabel(months[months.length - 1].month) : '—';

  // Sem contas bancárias registadas o património de partida não é zero — é
  // desconhecido, e dizer "0,00 €" faz a projeção parecer a de quem não tem
  // nada. O que se projeta nesse caso é o que se acumula a partir de hoje.
  const netWorthUnknown =
    !baseline.netWorthKnown && projection.scenario.startingNetWorth == null;

  // Um horizonte de 5 anos começa no mês seguinte, portanto o primeiro e o
  // último ano da tabela são pedaços de ano. Sem o dizer, parecia que num ano
  // se ganhava um terço do outro.
  const monthsPerYear = new Map<number, number>();
  for (const month of months) {
    const year = Number(month.month.slice(0, 4));
    monthsPerYear.set(year, (monthsPerYear.get(year) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <MixedCurrencyWarning currencies={projection.unconvertedCurrencies} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Património hoje"
          value={netWorthUnknown ? 'Por saber' : money(summary.startBalance)}
          hint={
            netWorthUnknown
              ? 'Sem contas registadas — a projeção conta só o que se acumula a partir de hoje'
              : 'Soma das contas não arquivadas'
          }
        />
        <StatCard
          label={
            netWorthUnknown ? `Acumulado até ${horizonEnd}` : `Património em ${horizonEnd}`
          }
          value={money(summary.endBalance)}
          tone={summary.endBalance >= summary.startBalance ? 'positive' : 'negative'}
          hint={`${growth >= 0 ? '+' : ''}${money(growth)} no horizonte`}
        />
        <StatCard
          label="Sobra por mês"
          value={money(summary.monthlySurplus)}
          tone={summary.monthlySurplus >= 0 ? 'positive' : 'negative'}
          hint="Média do primeiro ano projetado"
        />
        <StatCard
          label="Premissas"
          value={`${projection.scenario.inflationPct}% infl.`}
          hint={`Receita ${projection.scenario.incomeGrowthPct >= 0 ? '+' : ''}${projection.scenario.incomeGrowthPct}% · Poupança ${projection.scenario.savingsReturnPct}%`}
        />
      </div>

      {netWorthUnknown && (
        <Surface className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-white">
              A app não sabe com quanto é que se parte.
            </strong>{' '}
            Sem contas bancárias registadas, os saldos abaixo são o que se{' '}
            <em>acumula</em> daqui para a frente, não o património real. Regista as
            contas em Contas bancárias — ou escreve o valor de partida nas premissas do
            cenário — e o número passa a ser o teu.
          </p>
        </Surface>
      )}

      {summary.monthlySurplus < 0 && (
        <Surface className="border-error-300 p-4 dark:border-error-500/40">
          <p className="text-sm text-error-600 dark:text-error-400">
            <strong>Este rumo gasta mais do que entra.</strong> Ao ritmo actual o
            património desce {money(Math.abs(summary.monthlySurplus))} por mês. As metas
            abaixo não têm de onde ser financiadas enquanto isto não mudar.
          </p>
        </Surface>
      )}

      <Surface className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
            Os próximos {projection.scenario.horizonYears} anos
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Valores em {displayCurrency}
          </span>
        </div>
        <ProjectionChart months={months} displayCurrency={displayCurrency} />
      </Surface>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Ano</th>
                <th className="px-4 py-3 text-right font-medium">Receita</th>
                <th className="px-4 py-3 text-right font-medium">Despesa</th>
                <th className="px-4 py-3 text-right font-medium">Sobra</th>
                <th className="px-4 py-3 text-right font-medium">Património no fim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {years.map((year) => (
                <tr key={year.year} className="text-gray-700 dark:text-gray-300">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {year.year}
                    {(monthsPerYear.get(year.year) ?? 12) < 12 && (
                      <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                        {monthsPerYear.get(year.year)} meses
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{money(year.income)}</td>
                  <td className="px-4 py-3 text-right">{money(year.expense)}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      year.net >= 0
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-error-500 dark:text-error-400'
                    }`}
                  >
                    {money(year.net)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                    {money(year.endBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface className="p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setShowBaseline((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span>
            <span className="font-display text-base font-semibold text-gray-900 dark:text-white">
              De onde vêm estes números
            </span>
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              {baseline.commitments.length}{' '}
              {baseline.commitments.length === 1 ? 'contrato' : 'contratos'} + média de{' '}
              {baseline.monthsCovered} {baseline.monthsCovered === 1 ? 'mês' : 'meses'} de
              histórico
              {baseline.monthsCovered > 0 &&
                ` (${monthLabel(baseline.window.start)} a ${monthLabel(baseline.window.end)})`}
            </span>
          </span>
          <span className="text-sm text-brand-500 dark:text-brand-400">
            {showBaseline ? 'Esconder' : 'Ver'}
          </span>
        </button>

        {baseline.monthsCovered < 6 && (
          <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            Com {baseline.monthsCovered}{' '}
            {baseline.monthsCovered === 1 ? 'mês' : 'meses'} de histórico, a média ainda
            apanha pouco. Um gasto anual que não tenha caído nesta janela não está a ser
            contado.
          </p>
        )}

        {showBaseline && (
          <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Contratado (recorrentes)
              </h4>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                O que se sabe de certeza. Conta pelo valor cheio enquanto durar.
              </p>
              <ul className="space-y-1.5">
                {baseline.commitments.length === 0 && (
                  <li className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma recorrente registada. Sem elas, a projeção só tem a média do
                    histórico para adivinhar o futuro.
                  </li>
                )}
                {baseline.commitments.map((c) => (
                  <li
                    key={`${c.name}-${c.startsAt}`}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">
                      {c.name}
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        {c.endsAfter ? `até ${monthLabel(c.endsAfter)}` : 'sem fim'}
                      </span>
                    </span>
                    <span
                      className={
                        c.type === 'income'
                          ? 'shrink-0 text-success-600 dark:text-success-400'
                          : 'shrink-0 text-gray-600 dark:text-gray-400'
                      }
                    >
                      {c.type === 'income' ? '+' : '−'}
                      {money(c.monthlyAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                O que varia (média do histórico)
              </h4>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Já sem o que os contratos acima explicam — assim a renda não conta duas
                vezes.
              </p>
              <ul className="space-y-1.5">
                {baseline.lines.length === 0 && (
                  <li className="text-sm text-gray-500 dark:text-gray-400">
                    Fora dos contratos, o histórico não mostra mais nada.
                  </li>
                )}
                {baseline.lines.map((line) => (
                  <li
                    key={`${line.categoryId}-${line.type}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-gray-700 dark:text-gray-300">
                      {line.name}
                    </span>
                    <span
                      className={
                        line.type === 'income'
                          ? 'shrink-0 text-success-600 dark:text-success-400'
                          : 'shrink-0 text-gray-600 dark:text-gray-400'
                      }
                    >
                      {line.type === 'income' ? '+' : '−'}
                      {money(line.monthlyAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </Surface>
    </div>
  );
}
