import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { formatMoney } from '../../utils/currency';

export type MonthlyReportPoint = {
  label: string;
  income: number;
  expense: number;
  balance: number;
};

export type CategoryReportPoint = {
  name: string;
  value: number;
};

export type DailyReportPoint = {
  label: string;
  balance: number;
};

const axisLabel = {
  colors: '#9CA3AF',
  fontSize: '11px',
};

export function CashFlowChart({
  points,
  currency,
}: {
  points: MonthlyReportPoint[];
  currency?: string;
}) {
  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: '#9CA3AF',
    },
    colors: ['#34D399', '#FB7185', '#60A5FA'],
    dataLabels: { enabled: false },
    stroke: { width: [0, 0, 3], curve: 'smooth' },
    plotOptions: {
      bar: {
        columnWidth: '58%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    xaxis: {
      categories: points.map((point) => point.label),
      labels: { style: axisLabel },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: axisLabel,
        formatter: (value) => formatMoney(value, currency),
      },
    },
    grid: { borderColor: '#374151', strokeDashArray: 4 },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      labels: { colors: '#9CA3AF' },
      markers: { size: 8 },
    },
    tooltip: {
      theme: 'dark',
      shared: true,
      y: { formatter: (value) => formatMoney(value, currency) },
    },
  };

  const series = [
    { name: 'Receitas', type: 'column', data: points.map((point) => point.income) },
    { name: 'Despesas', type: 'column', data: points.map((point) => point.expense) },
    { name: 'Saldo', type: 'line', data: points.map((point) => point.balance) },
  ];

  return <Chart options={options} series={series} type="line" height={330} />;
}

export function CategoryReportChart({
  points,
  currency,
}: {
  points: CategoryReportPoint[];
  currency?: string;
}) {
  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
    colors: ['#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#FB7185', '#64748B'],
    labels: points.map((point) => point.name),
    dataLabels: { enabled: false },
    stroke: { width: 3, colors: ['transparent'] },
    legend: {
      position: 'bottom',
      labels: { colors: '#9CA3AF' },
      markers: { size: 8 },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: { show: true, color: '#9CA3AF' },
            value: {
              show: true,
              color: '#9CA3AF',
              formatter: (value) => formatMoney(Number(value), currency),
            },
            total: {
              show: true,
              label: 'Despesas',
              color: '#9CA3AF',
              formatter: (chart) =>
                formatMoney(
                  chart.globals.seriesTotals.reduce((sum: number, value: number) => sum + value, 0),
                  currency
                ),
            },
          },
        },
      },
    },
    tooltip: { theme: 'dark', y: { formatter: (value) => formatMoney(value, currency) } },
    responsive: [
      {
        breakpoint: 640,
        options: { chart: { height: 290 }, legend: { position: 'bottom' } },
      },
    ],
  };

  return (
    <Chart
      options={options}
      series={points.map((point) => point.value)}
      type="donut"
      height={330}
    />
  );
}

export function DailyBalanceChart({
  points,
  currency,
}: {
  points: DailyReportPoint[];
  currency?: string;
}) {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: '#9CA3AF',
    },
    colors: ['#60A5FA'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.03, stops: [0, 95, 100] },
    },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      categories: points.map((point) => point.label),
      labels: { style: axisLabel, rotate: 0, hideOverlappingLabels: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 8,
    },
    yaxis: {
      labels: {
        style: axisLabel,
        formatter: (value) => formatMoney(value, currency),
      },
    },
    annotations: { yaxis: [{ y: 0, borderColor: '#6B7280', strokeDashArray: 4 }] },
    grid: { borderColor: '#374151', strokeDashArray: 4 },
    tooltip: { theme: 'dark', y: { formatter: (value) => formatMoney(value, currency) } },
  };

  return (
    <Chart
      options={options}
      series={[{ name: 'Saldo acumulado', data: points.map((point) => point.balance) }]}
      type="area"
      height={290}
    />
  );
}
