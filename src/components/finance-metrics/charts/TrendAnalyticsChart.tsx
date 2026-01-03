// src/components/finance-metrics/charts/TrendAnalyticsChart.tsx
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useFinance } from '../../../hooks/useFinance';

interface TrendAnalyticsChartProps {
  dateRange: { startDate: string; endDate: string };
}

const TrendAnalyticsChart: React.FC<TrendAnalyticsChartProps> = ({ dateRange }) => {
  const { getAllFinances, isLoading } = useFinance();
  const [trendData, setTrendData] = useState<{
    dates: string[];
    balance: number[];
    income: number[];
    expense: number[];
    cumulativeBalance: number[];
  }>({ dates: [], balance: [], income: [], expense: [], cumulativeBalance: [] });

  useEffect(() => {
    const loadTrendData = async () => {
      try {
        const transactions = await getAllFinances({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        // Ordenar transações por data
        const sortedTransactions = [...transactions].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Agrupar por dia e calcular saldo diário
        const dailyData: Record<string, { income: number; expense: number; balance: number }> = {};

        sortedTransactions.forEach((transaction) => {
          const date = new Date(transaction.createdAt).toISOString().split('T')[0];

          if (!dailyData[date]) {
            dailyData[date] = { income: 0, expense: 0, balance: 0 };
          }

          if (transaction.type === 'income') {
            dailyData[date].income += transaction.amount;
            dailyData[date].balance += transaction.amount;
          } else {
            dailyData[date].expense += transaction.amount;
            dailyData[date].balance -= transaction.amount;
          }
        });

        // Converter para arrays e calcular saldo acumulado
        const dates = Object.keys(dailyData).sort();
        const income = dates.map((date) => dailyData[date].income);
        const expense = dates.map((date) => dailyData[date].expense);
        const balance = dates.map((date) => dailyData[date].balance);

        // Calcular saldo acumulado
        const cumulativeBalance: number[] = [];
        let runningBalance = 0;

        balance.forEach((dailyBalance, index) => {
          runningBalance += dailyBalance;
          cumulativeBalance.push(runningBalance);
        });

        setTrendData({ dates, balance, income, expense, cumulativeBalance });
      } catch (error) {
        console.error('Erro ao carregar dados de tendência:', error);
      }
    };

    loadTrendData();
  }, [dateRange]);

  const options: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false,
      },
      fontFamily: 'Inter, sans-serif',
      foreColor: '#6B7280',
      zoom: {
        enabled: false,
      },
    },
    colors: ['#3B82F6', '#EF4444', '#10B981'],
    stroke: {
      curve: 'smooth',
      width: [3, 3, 4],
      dashArray: [0, 0, 5],
    },
    markers: {
      size: 5,
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    xaxis: {
      categories: trendData.dates,
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px',
        },
        formatter: (value) => {
          const date = new Date(value);
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: [
      {
        title: {
          text: 'Saldo (R$)',
          style: {
            color: '#3B82F6',
            fontSize: '12px',
            fontWeight: 400,
          },
        },
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
          },
          formatter: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
      },
      {
        opposite: true,
        title: {
          text: 'Transações (R$)',
          style: {
            color: '#6B7280',
            fontSize: '12px',
            fontWeight: 400,
          },
        },
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
          },
          formatter: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
      },
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '14px',
      fontWeight: 400,
      labels: {
        colors: '#6B7280',
      },
      markers: {
        width: 12,
        height: 12,
        radius: 6,
      },
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'dark',
      y: {
        formatter: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      x: {
        formatter: (value) => {
          const date = new Date(value);
          return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        },
      },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: 'top',
            horizontalAlign: 'center',
          },
        },
      },
    ],
  };

  const series = [
    {
      name: 'Saldo Acumulado',
      data: trendData.cumulativeBalance,
      type: 'line',
    },
    {
      name: 'Receitas Diárias',
      data: trendData.income,
      type: 'line',
    },
    {
      name: 'Despesas Diárias',
      data: trendData.expense,
      type: 'line',
    },
  ];

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando tendências...</p>
        </div>
      </div>
    );
  }

  if (trendData.dates.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <i className="fas fa-chart-line text-4xl mb-3"></i>
        <p className="text-lg font-medium">Sem dados de tendência</p>
        <p className="text-sm mt-1">Não há transações suficientes para análise de tendência</p>
      </div>
    );
  }

  // Calcular estatísticas
  const totalIncome = trendData.income.reduce((a, b) => a + b, 0);
  const totalExpense = trendData.expense.reduce((a, b) => a + b, 0);
  const netBalance = totalIncome - totalExpense;
  const avgDailyBalance =
    trendData.balance.length > 0
      ? trendData.balance.reduce((a, b) => a + b, 0) / trendData.balance.length
      : 0;

  const lastBalance = trendData.cumulativeBalance[trendData.cumulativeBalance.length - 1] || 0;
  const firstBalance = trendData.cumulativeBalance[0] || 0;
  const balanceChange = lastBalance - firstBalance;
  const balanceChangePercent =
    firstBalance !== 0 ? (balanceChange / Math.abs(firstBalance)) * 100 : 0;

  return (
    <div>
      <div className="h-80">
        <Chart options={options} series={series} type="line" height="100%" />
      </div>

      {/* Estatísticas abaixo do gráfico */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
              <i className="fas fa-chart-line text-blue-600 dark:text-blue-400"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Variação do Saldo</p>
              <p
                className={`text-lg font-semibold ${
                  balanceChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {balanceChange >= 0 ? '+' : ''}R${' '}
                {balanceChange.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                <span className="text-sm ml-2">({balanceChangePercent.toFixed(1)}%)</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
              <i className="fas fa-arrow-up text-green-600 dark:text-green-400"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Média Diária</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                R$ {avgDailyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
              <i className="fas fa-calendar-alt text-purple-600 dark:text-purple-400"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Período Analisado</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {trendData.dates.length} dias
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mr-3">
              <i className="fas fa-balance-scale text-orange-600 dark:text-orange-400"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Final</p>
              <p
                className={`text-lg font-semibold ${
                  lastBalance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                R$ {lastBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <i className="fas fa-lightbulb text-blue-600 dark:text-blue-400"></i>
            </div>
          </div>
          <div className="ml-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
              Insight da Tendência
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {netBalance >= 0
                ? 'Seu saldo está em tendência positiva. Continue com o bom gerenciamento financeiro!'
                : 'Seu saldo está em tendência negativa. Considere revisar suas despesas para equilibrar as finanças.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalyticsChart;
