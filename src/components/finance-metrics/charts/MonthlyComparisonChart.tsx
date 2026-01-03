// src/components/finance-metrics/charts/MonthlyComparisonChart.tsx
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useFinance } from '../../../hooks/useFinance';

interface MonthlyComparisonChartProps {
  dateRange: { startDate: string; endDate: string };
}

const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ dateRange }) => {
  const { getAllFinances, isLoading } = useFinance();
  const [chartData, setChartData] = useState<{
    months: string[];
    income: number[];
    expense: number[];
  }>({ months: [], income: [], expense: [] });

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const transactions = await getAllFinances({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        // Agrupar por mês
        const groupedByMonth = transactions.reduce(
          (acc, transaction) => {
            const date = new Date(transaction.createdAt);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

            if (!acc[monthYear]) {
              acc[monthYear] = { income: 0, expense: 0 };
            }

            if (transaction.type === 'income') {
              acc[monthYear].income += transaction.amount;
            } else {
              acc[monthYear].expense += transaction.amount;
            }

            return acc;
          },
          {} as Record<string, { income: number; expense: number }>
        );

        // Ordenar por data
        const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
          const [monthA, yearA] = a.split('/').map(Number);
          const [monthB, yearB] = b.split('/').map(Number);
          return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
        });

        const months = sortedMonths;
        const income = sortedMonths.map((month) => groupedByMonth[month].income);
        const expense = sortedMonths.map((month) => groupedByMonth[month].expense);

        setChartData({ months, income, expense });
      } catch (error) {
        console.error('Erro ao carregar dados do gráfico:', error);
      }
    };

    loadChartData();
  }, [dateRange]);

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: false,
      toolbar: {
        show: false,
      },
      fontFamily: 'Inter, sans-serif',
      foreColor: '#6B7280',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    colors: ['#10B981', '#EF4444'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData.months,
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: 'Valor (R$)',
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
    fill: {
      opacity: 1,
    },
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
      y: {
        formatter: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      theme: 'dark',
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 300,
          },
        },
      },
    ],
  };

  const series = [
    {
      name: 'Receitas',
      data: chartData.income,
    },
    {
      name: 'Despesas',
      data: chartData.expense,
    },
  ];

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (chartData.months.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <i className="fas fa-chart-bar text-4xl mb-3"></i>
        <p className="text-lg font-medium">Sem dados disponíveis</p>
        <p className="text-sm mt-1">Não há transações no período selecionado</p>
      </div>
    );
  }

  return (
    <div>
      <div className="h-80">
        <Chart options={options} series={series} type="bar" height="100%" />
      </div>

      {/* Resumo abaixo do gráfico */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
              <i className="fas fa-arrow-up text-green-600 dark:text-green-400"></i>
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Total Receitas</p>
              <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                R${' '}
                {chartData.income
                  .reduce((a, b) => a + b, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3">
              <i className="fas fa-arrow-down text-red-600 dark:text-red-400"></i>
            </div>
            <div>
              <p className="text-sm text-red-700 dark:text-red-300">Total Despesas</p>
              <p className="text-lg font-semibold text-red-800 dark:text-red-200">
                R${' '}
                {chartData.expense
                  .reduce((a, b) => a + b, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
              <i className="fas fa-balance-scale text-blue-600 dark:text-blue-400"></i>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Saldo Total</p>
              <p
                className={`text-lg font-semibold ${
                  chartData.income.reduce((a, b) => a + b, 0) -
                    chartData.expense.reduce((a, b) => a + b, 0) >=
                  0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                R${' '}
                {(
                  chartData.income.reduce((a, b) => a + b, 0) -
                  chartData.expense.reduce((a, b) => a + b, 0)
                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparisonChart;
