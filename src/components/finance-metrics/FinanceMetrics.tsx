// src/components/finance-metrics/FinanceMetrics.tsx
import React from 'react';
import Badge, { BadgeColor } from '../ui/badge/Badge';
interface MetricItem {
  id: number;
  title: string;
  value: string;
  change: string;
  variation: number;
  direction: string;
  comparisonText: string;
  icon: string;
  color: string;
  bgColor: string;
  badgeColor: BadgeColor;
}
interface FinanceMetricsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
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
      value: `R$ ${formatCurrency(safeTotalBalance)}`,
      change: safeTotalBalance >= 0 ? '+' : '-',
      variation: safeTotalBalance >= 0 ? balanceVariation : -balanceVariation,
      direction: safeTotalBalance >= 0 ? 'up' : 'down',
      comparisonText: 'Disponível',
      icon: 'wallet',
      color:
        safeTotalBalance >= 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400',
      bgColor:
        safeTotalBalance >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
      badgeColor: safeTotalBalance >= 0 ? 'success' : 'error',
    },
    {
      id: 2,
      title: 'Total de Ganhos',
      value: `R$ ${formatCurrency(safeTotalIncome)}`,
      change: incomeVariation >= 0 ? '+' : '-',
      variation: Math.abs(incomeVariation),
      direction: incomeVariation >= 0 ? 'up' : 'down',
      comparisonText: 'vs período anterior',
      icon: 'arrow-up',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      badgeColor: incomeVariation >= 0 ? 'success' : 'error',
    },
    {
      id: 3,
      title: 'Total de Despesas',
      value: `R$ ${formatCurrency(safeTotalExpense)}`,
      change: expenseVariation <= 0 ? '+' : '-',
      variation: Math.abs(expenseVariation),
      direction: expenseVariation <= 0 ? 'up' : 'down',
      comparisonText: 'vs período anterior',
      icon: 'arrow-down',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      badgeColor: expenseVariation <= 0 ? 'success' : 'error',
    },
    {
      id: 4,
      title: 'Saldo Líquido',
      value: `R$ ${formatCurrency(safeNetBalance)}`,
      change: safeNetBalance >= 0 ? '+' : '-',
      variation: Math.abs(balanceVariation),
      direction: safeNetBalance >= 0 ? 'up' : 'down',
      comparisonText: 'Ganhos - Despesas',
      icon: 'balance-scale',
      color:
        safeNetBalance >= 0
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-yellow-600 dark:text-yellow-400',
      bgColor:
        safeNetBalance >= 0
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'bg-yellow-50 dark:bg-yellow-900/20',
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

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Resumo Financeiro</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{periodText}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-5 transition-all duration-300 hover:shadow-lg ${item.bgColor} border-transparent`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${item.bgColor.replace('/20', '/30')}`}>
                <i className={`fas fa-${item.icon} ${item.color} text-lg`}></i>
              </div>
              {(item.id === 2 || item.id === 3 || item.id === 4) && (
                <Badge color={item.badgeColor || 'light'}>
                  <span className="text-xs font-medium">
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

            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
              {item.title}
            </p>
            <div className="flex items-end justify-between">
              <div>
                <h4 className={`text-2xl font-bold ${item.color}`}>{item.value}</h4>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                {item.comparisonText}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de progresso do saldo */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Proporção Ganhos/Despesas
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(expenseRatio)}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
            style={{ width: `${expenseRatio}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>Ganhos: R$ {formatCurrency(safeTotalIncome)}</span>
          <span>Despesas: R$ {formatCurrency(safeTotalExpense)}</span>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Baixo (0-30%)</span>
            <div className="w-3 h-3 rounded-full bg-yellow-500 ml-4"></div>
            <span>Moderado (30-70%)</span>
            <div className="w-3 h-3 rounded-full bg-red-500 ml-4"></div>
            <span>Alto (70-100%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceMetrics;
