// src/components/finance-metrics/charts/MonthlyComparisonChart.tsx
import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { formatMoney, currencyOption } from '../../../utils/currency';
import type { TimeSeries } from '../../../hooks/useAnalysisData';

/**
 * Só desenha. As somas vêm de `GET /analysis`, feitas no servidor — este
 * gráfico buscava a lista de transações e voltava a somá-la por si, o que era
 * uma segunda implementação das mesmas contas à espera de discordar da
 * primeira.
 */
interface MonthlyComparisonChartProps {
  timeSeries: TimeSeries;
  displayCurrency?: string;
}

const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  timeSeries,
  displayCurrency,
}) => {
  const currencySymbol = currencyOption(displayCurrency).symbol;
  const chartData = {
    months: timeSeries.labels,
    income: timeSeries.datasets[0]?.data ?? [],
    expense: timeSeries.datasets[1]?.data ?? [],
  };

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
    colors: ['#4ADE80', '#F87171'],
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
        text: `Valor (${currencySymbol})`,
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
        formatter: (value) => formatMoney(value, displayCurrency),
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
        size: 12,
        offsetX: 0,
        offsetY: 0,
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
        formatter: (value) => formatMoney(value, displayCurrency),
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
                {formatMoney(
                  chartData.income.reduce((a, b) => a + b, 0),
                  displayCurrency
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3">
              <i className="fas fa-arrow-down text-error-600 dark:text-red-400"></i>
            </div>
            <div>
              <p className="text-sm text-red-700 dark:text-red-300">Total Despesas</p>
              <p className="text-lg font-semibold text-red-800 dark:text-red-200">
                {formatMoney(
                  chartData.expense.reduce((a, b) => a + b, 0),
                  displayCurrency
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center mr-3">
              <i className="fas fa-balance-scale text-brand-600 dark:text-brand-400"></i>
            </div>
            <div>
              <p className="text-sm text-brand-700 dark:text-brand-300">Saldo Total</p>
              <p
                className={`text-lg font-semibold ${
                  chartData.income.reduce((a, b) => a + b, 0) -
                    chartData.expense.reduce((a, b) => a + b, 0) >=
                  0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-error-600 dark:text-red-400'
                }`}
              >
                {formatMoney(
                  chartData.income.reduce((a, b) => a + b, 0) -
                    chartData.expense.reduce((a, b) => a + b, 0),
                  displayCurrency
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparisonChart;
