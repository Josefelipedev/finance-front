// src/components/finance-metrics/FinanceMetrics.tsx
import React from 'react';
import Badge, { BadgeColor } from '../ui/badge/Badge';
import { CurrencyBreakdown } from '../../hooks/useFinance';
import { currencyOption, formatMoney } from '../../utils/currency';
interface MetricItem {
  id: number;
  title: string;
  value: string;
  change: string;
  comparisonText: string;
  icon: string;
  valueColor: string;
  iconChip: string;
  highlight?: boolean;
  badgeColor: BadgeColor;
  /** O que este número conta, para quem quiser saber ao certo (T6.6). */
  hint?: string;
  /** De quem é este número (C6). Só se desenha quando há mais do que um. */
  split?: { name: string; value: number }[];
}

/** A parte de cada pessoa nos totais, como vem da API (C6). */
export interface OwnerSplit {
  userId: number;
  name: string | null;
  ganhos: number;
  despesas: number;
}
interface FinanceMetricsProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  displayCurrency?: string;
  rateDate?: string | null;
  byCurrency?: CurrencyBreakdown[];
  byOwner?: OwnerSplit[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

const FinanceMetrics: React.FC<FinanceMetricsProps> = ({
  totalIncome,
  totalExpense,
  netBalance,
  displayCurrency = 'BRL',
  rateDate,
  byCurrency = [],
  byOwner = [],
  dateRange,
}) => {
  // Garantir que os valores não sejam undefined
  const safeTotalIncome = totalIncome || 0;
  const safeTotalExpense = totalExpense || 0;
  const safeNetBalance = netBalance || 0;

  // Havia aqui uma "variação vs período anterior" que era `atual × 0,8` por
  // omissão — ou seja, **+25% sempre**, em qualquer conta e em qualquer mês,
  // com o rótulo "vs período anterior" ao lado de dinheiro verdadeiro. O
  // próprio código admitia: "(simulado - você pode adaptar para dados reais)".
  // Saiu. Quando houver comparação a sério (a API já calcula o período
  // anterior em `analyzeFinanceSummary`), volta com números que existem.

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // De quem é este número (C6). As listas já diziam de quem era cada linha;
  // os totais não, e o casal via "gastou 1.430 €" sem saber que parte era sua.
  // Uma pessoa só = não há repartição para desenhar.
  const temReparticao = byOwner.length > 1;
  const primeiroNome = (nome: string | null, id: number) =>
    (nome ?? `#${id}`).trim().split(/\s+/)[0];
  const repartir = (de: (o: OwnerSplit) => number) =>
    temReparticao
      ? byOwner.map((o) => ({
          name: primeiroNome(o.name, o.userId),
          value: de(o),
        }))
      : undefined;

  const metrics: MetricItem[] = [
    // Havia aqui um cartão "Saldo Total / Disponível" que mostrava
    // `totalBalance` do `/finance/dashboard` — ganhos menos despesas do MESMO
    // período que o "Saldo Líquido" logo ao lado, calculado por outro
    // endpoint. Dois cartões, dois nomes, o mesmo número; e nenhum dos dois era
    // "disponível", porque isso seria o saldo das contas bancárias, que hoje é
    // um valor informado à mão (ponto 10 da revisão). Saiu o duplicado e ficou
    // o que diz o que é.
    {
      id: 2,
      title: 'Total de Ganhos',
      value: formatMoney(safeTotalIncome, displayCurrency),
      change: '+',
      comparisonText: 'no período',
      icon: 'arrow-trend-up',
      valueColor: 'text-green-600 dark:text-green-400',
      iconChip: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
      badgeColor: 'success',
      split: repartir((o) => o.ganhos),
    },
    {
      id: 3,
      title: 'Total de Despesas',
      value: formatMoney(safeTotalExpense, displayCurrency),
      change: '-',
      comparisonText: 'no período',
      // Um total que a pessoa não sabe definir não é um total em que se possa
      // confiar (T6.6). Cinco módulos emitem lançamentos e nem todos são gasto.
      hint: 'Dinheiro gasto: lançamentos manuais, contas pagas, listas de compras e cardápios fechados. Depósitos em metas NÃO entram — são transferências.',
      icon: 'arrow-trend-down',
      valueColor: 'text-error-600 dark:text-red-400',
      iconChip: 'bg-red-50 text-error-600 dark:bg-error-500/10 dark:text-red-400',
      badgeColor: 'error',
    },
    {
      id: 4,
      title: 'Saldo Líquido',
      value: formatMoney(safeNetBalance, displayCurrency),
      change: safeNetBalance >= 0 ? '+' : '-',
      comparisonText: 'Ganhos - Despesas',
      icon: 'scale-balanced',
      highlight: true,
      valueColor:
        safeNetBalance >= 0
          ? 'text-gray-900 dark:text-white'
          : 'text-yellow-600 dark:text-yellow-400',
      iconChip: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300',
      badgeColor: safeNetBalance >= 0 ? 'success' : 'warning',
      split: repartir((o) => o.ganhos - o.despesas),
    },
  ];

  const periodText =
    dateRange?.startDate && dateRange?.endDate
      ? `Período: ${new Date(dateRange.startDate).toLocaleDateString('pt-BR')} à ${new Date(dateRange.endDate).toLocaleDateString('pt-BR')}`
      : 'Período: Total';

  // Calcular proporção para a barra de progresso
  const expenseRatio =
    safeTotalIncome > 0 ? Math.min(100, (safeTotalExpense / safeTotalIncome) * 100) : 0;

  const ratioColor =
    expenseRatio <= 30 ? 'bg-brand-400' : expenseRatio <= 70 ? 'bg-yellow-400' : 'bg-error-500';

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
              item.highlight
                ? 'border-brand-200 bg-brand-25 dark:border-brand-400/20 dark:bg-gray-800 dark:bg-gradient-to-br dark:from-brand-400/[0.14] dark:to-gray-800 dark:shadow-glow'
                : 'border-gray-200 bg-white dark:border-white/[0.06] dark:bg-gray-800'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconChip}`}
              >
                <i className={`fas fa-${item.icon} text-base`}></i>
              </div>
              <Badge color={item.badgeColor || 'light'}>
                <span className="text-xs font-medium">{item.change}</span>
              </Badge>
            </div>

            <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              {item.title}
              {item.hint && (
                <i
                  title={item.hint}
                  className="fas fa-circle-info cursor-help text-[11px] text-gray-400 dark:text-gray-500"
                />
              )}
            </p>
            <h4
              className={`font-display text-2xl font-semibold tracking-tight tabular-nums ${item.valueColor}`}
            >
              {item.value}
            </h4>

            {/* De quem é este número (C6). As partes somam o total acima —
                é a mesma soma, guardada por dono pelo caminho. */}
            {item.split && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {item.split.map((parte) => (
                  <span
                    key={parte.name}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {parte.name}{' '}
                    <span className="font-medium tabular-nums text-gray-700 dark:text-gray-200">
                      {formatMoney(parte.value, displayCurrency)}
                    </span>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {item.comparisonText}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown nativo por moeda (aparece quando o casal usa mais de uma) */}
      {byCurrency.length > 1 && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-gray-800 sm:mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {byCurrency.map((c) => {
                const opt = currencyOption(c.currency);
                return (
                  <span
                    key={c.currency}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium tabular-nums text-gray-600 dark:border-white/[0.08] dark:text-gray-300"
                  >
                    <span>
                      {opt.flag} {c.currency}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      +{formatMoney(c.ganhos, c.currency)}
                    </span>
                    <span className="text-error-600 dark:text-red-400">
                      −{formatMoney(c.despesas, c.currency)}
                    </span>
                  </span>
                );
              })}
            </div>
            {rateDate && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Totais convertidos p/ {currencyOption(displayCurrency).flag} {displayCurrency} ·
                câmbio BCE de {new Date(rateDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Barra de progresso do saldo */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.06] dark:bg-gray-800 sm:mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quanto das receitas já foi gasto
            </span>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{periodText}</p>
          </div>
          <span className="font-display text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
            {Math.round(expenseRatio)}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${ratioColor}`}
            style={{ width: `${expenseRatio}%` }}
          ></div>
        </div>
        <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="tabular-nums">
            <i className="fas fa-arrow-trend-up mr-1.5 text-green-500"></i>
            Ganhos: {formatMoney(safeTotalIncome, displayCurrency)}
          </span>
          <span className="tabular-nums">
            <i className="fas fa-arrow-trend-down mr-1.5 text-error-500"></i>
            Despesas: {formatMoney(safeTotalExpense, displayCurrency)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FinanceMetrics;
