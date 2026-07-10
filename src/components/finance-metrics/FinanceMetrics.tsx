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
  variation: number;
  direction: string;
  comparisonText: string;
  icon: string;
  valueColor: string;
  iconChip: string;
  highlight?: boolean;
  badgeColor: BadgeColor;
}
interface FinanceMetricsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  displayCurrency?: string;
  rateDate?: string | null;
  byCurrency?: CurrencyBreakdown[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

const FinanceMetrics: React.FC<FinanceMetricsProps> = ({
  totalBalance,
  totalIncome,
  totalExpense,
  netBalance,
  displayCurrency = 'BRL',
  rateDate,
  byCurrency = [],
  dateRange,
}) => {
  // Garantir que os valores não sejam undefined
  const safeTotalBalance = totalBalance || 0;
  const safeTotalIncome = totalIncome || 0;
  const safeTotalExpense = totalExpense || 0;
  const safeNetBalance = netBalance || 0;

  // Calcular variações (simulado - você pode adaptar para dados reais)
  const getVariation = (current: number, previous: number = current * 0.8) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeVariation = getVariation(safeTotalIncome);
  const expenseVariation = getVariation(safeTotalExpense);
  const balanceVariation = getVariation(safeNetBalance, safeTotalIncome * 0.2);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const metrics: MetricItem[] = [
    {
      id: 1,
      title: 'Saldo Total',
      value: formatMoney(safeTotalBalance, displayCurrency),
      change: safeTotalBalance >= 0 ? '+' : '-',
      variation: safeTotalBalance >= 0 ? balanceVariation : -balanceVariation,
      direction: safeTotalBalance >= 0 ? 'up' : 'down',
      comparisonText: 'Disponível',
      icon: 'wallet',
      valueColor:
        safeTotalBalance >= 0
          ? 'text-brand-700 dark:text-brand-300'
          : 'text-error-600 dark:text-red-400',
      iconChip: 'bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300',
      highlight: true,
      badgeColor: safeTotalBalance >= 0 ? 'success' : 'error',
    },
    {
      id: 2,
      title: 'Total de Ganhos',
      value: formatMoney(safeTotalIncome, displayCurrency),
      change: incomeVariation >= 0 ? '+' : '-',
      variation: Math.abs(incomeVariation),
      direction: incomeVariation >= 0 ? 'up' : 'down',
      comparisonText: 'vs período anterior',
      icon: 'arrow-trend-up',
      valueColor: 'text-green-600 dark:text-green-400',
      iconChip: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
      badgeColor: incomeVariation >= 0 ? 'success' : 'error',
    },
    {
      id: 3,
      title: 'Total de Despesas',
      value: formatMoney(safeTotalExpense, displayCurrency),
      change: expenseVariation <= 0 ? '+' : '-',
      variation: Math.abs(expenseVariation),
      direction: expenseVariation <= 0 ? 'up' : 'down',
      comparisonText: 'vs período anterior',
      icon: 'arrow-trend-down',
      valueColor: 'text-error-600 dark:text-red-400',
      iconChip: 'bg-red-50 text-error-600 dark:bg-error-500/10 dark:text-red-400',
      badgeColor: expenseVariation <= 0 ? 'success' : 'error',
    },
    {
      id: 4,
      title: 'Saldo Líquido',
      value: formatMoney(safeNetBalance, displayCurrency),
      change: safeNetBalance >= 0 ? '+' : '-',
      variation: Math.abs(balanceVariation),
      direction: safeNetBalance >= 0 ? 'up' : 'down',
      comparisonText: 'Ganhos - Despesas',
      icon: 'scale-balanced',
      valueColor:
        safeNetBalance >= 0
          ? 'text-gray-900 dark:text-white'
          : 'text-yellow-600 dark:text-yellow-400',
      iconChip: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300',
      badgeColor: safeNetBalance >= 0 ? 'success' : 'warning',
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              {(item.id === 2 || item.id === 3 || item.id === 4) && (
                <Badge color={item.badgeColor || 'light'}>
                  <span className="text-xs font-medium tabular-nums">
                    {item.change}
                    {item.variation.toFixed(1)}%
                  </span>
                </Badge>
              )}
              {item.id === 1 && safeTotalBalance !== 0 && (
                <Badge color={item.badgeColor}>
                  <span className="text-xs font-medium">{item.change}</span>
                </Badge>
              )}
            </div>

            <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              {item.title}
            </p>
            <h4
              className={`font-display text-2xl font-semibold tracking-tight tabular-nums ${item.valueColor}`}
            >
              {item.value}
            </h4>

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
                    <span>{opt.flag} {c.currency}</span>
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
                Totais convertidos p/ {currencyOption(displayCurrency).flag} {displayCurrency} · câmbio BCE de{' '}
                {new Date(rateDate + 'T00:00:00').toLocaleDateString('pt-BR')}
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
