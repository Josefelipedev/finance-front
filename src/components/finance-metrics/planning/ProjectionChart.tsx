import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { formatMoney, currencyOption } from '../../../utils/currency';
import type { ProjectionMonth } from '../../../hooks/usePlanning';

interface Props {
  months: ProjectionMonth[];
  displayCurrency?: string;
}

/**
 * Só desenha. Os números vêm todos do servidor, já convertidos — o património
 * é a linha que interessa, e as barras de receita/despesa explicam-lhe a
 * inclinação.
 *
 * Numa projeção a 5 anos são 60 pontos: com um ponto por mês o eixo fica
 * ilegível, por isso os marcadores desaparecem e o eixo só rotula alguns
 * meses. A série continua mensal — é a leitura que muda, não os dados.
 */
const ProjectionChart: React.FC<Props> = ({ months, displayCurrency }) => {
  const symbol = currencyOption(displayCurrency).symbol;

  const labels = months.map((m) => m.month);
  const options: ApexOptions = {
    chart: {
      type: 'line',
      height: 380,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: '#6B7280',
      zoom: { enabled: false },
      animations: { enabled: false },
    },
    colors: ['#A3E635', '#F87171', '#4ADE80'],
    stroke: { curve: 'smooth', width: [0, 0, 3] },
    plotOptions: { bar: { columnWidth: '70%', borderRadius: 2 } },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '13px' },
    grid: { borderColor: 'rgba(148,163,184,0.15)', strokeDashArray: 4 },
    xaxis: {
      categories: labels,
      // Um rótulo por trimestre chega para se perceber onde se está.
      tickAmount: Math.min(12, labels.length),
      labels: {
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: true,
        style: { fontSize: '11px' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        seriesName: 'Receita',
        labels: {
          formatter: (v: number) => `${symbol} ${Math.round(v / 1000)}k`,
          style: { fontSize: '11px' },
        },
      },
      { seriesName: 'Receita', show: false },
      {
        opposite: true,
        seriesName: 'Património',
        labels: {
          formatter: (v: number) => `${symbol} ${Math.round(v / 1000)}k`,
          style: { fontSize: '11px' },
        },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (v: number) => formatMoney(v ?? 0, displayCurrency) },
    },
  };

  const series = [
    { name: 'Receita', type: 'column', data: months.map((m) => m.income) },
    { name: 'Despesa', type: 'column', data: months.map((m) => m.expense) },
    { name: 'Património', type: 'line', data: months.map((m) => m.balance) },
  ];

  return <Chart options={options} series={series} type="line" height={380} />;
};

export default ProjectionChart;
