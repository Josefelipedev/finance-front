// src/components/finance-metrics/charts/CategoryAnalyticsChart.tsx
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useFinance } from '../../../hooks/useFinance';

interface CategoryAnalyticsChartProps {
  dateRange: { startDate: string; endDate: string };
}

const CategoryAnalyticsChart: React.FC<CategoryAnalyticsChartProps> = ({ dateRange }) => {
  const { getAllFinances, isLoading } = useFinance();
  const [categoryData, setCategoryData] = useState<
    Array<{
      name: string;
      value: number;
      color: string;
      icon: string;
    }>
  >([]);

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        const transactions = await getAllFinances({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        // Cores para categorias
        const categoryColors: Record<string, { color: string; icon: string }> = {
          Alimentação: { color: '#10B981', icon: 'utensils' },
          Transporte: { color: '#3B82F6', icon: 'car' },
          Moradia: { color: '#8B5CF6', icon: 'home' },
          Lazer: { color: '#F59E0B', icon: 'film' },
          Saúde: { color: '#EF4444', icon: 'heart' },
          Educação: { color: '#06B6D4', icon: 'graduation-cap' },
          Salário: { color: '#10B981', icon: 'money-bill' },
          Investimentos: { color: '#8B5CF6', icon: 'chart-line' },
        };

        // Agrupar por categoria (simulação - você precisará adaptar com seus dados reais)
        const categoryTotals: Record<string, number> = {};

        transactions.forEach((transaction: any) => {
          const categoryName = transaction.categoryId
            ? `Categoria ${transaction.categoryId}`
            : 'Sem categoria';
          if (!categoryTotals[categoryName]) {
            categoryTotals[categoryName] = 0;
          }
          categoryTotals[categoryName] += Math.abs(transaction.amount);
        });

        // Converter para array e mapear cores
        const dataArray = Object.entries(categoryTotals)
          .map(([name, value]) => ({
            name,
            value,
            color: categoryColors[name]?.color || '#6B7280',
            icon: categoryColors[name]?.icon || 'tag',
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8); // Limitar às 8 principais categorias

        setCategoryData(dataArray);
      } catch (error) {
        console.error('Erro ao carregar dados de categoria:', error);
      }
    };

    loadCategoryData();
  }, [dateRange]);

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
      fontFamily: 'Inter, sans-serif',
    },
    colors: categoryData.map((item) => item.color),
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              color: '#6B7280',
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              formatter: (val) =>
                `R$ ${parseFloat(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            },
            total: {
              show: true,
              label: 'Total',
              color: '#6B7280',
              formatter: (w) => {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              },
            },
          },
        },
      },
    },
    labels: categoryData.map((item) => item.name),
    legend: {
      position: 'right',
      horizontalAlign: 'center',
      fontSize: '12px',
      fontWeight: 400,
      labels: {
        colors: '#6B7280',
        useSeriesColors: false,
      },
      markers: {
        size: 12,
        offsetX: 0,
        offsetY: 0,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      theme: 'dark',
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 250,
          },
          legend: {
            position: 'bottom',
            fontSize: '10px',
          },
        },
      },
    ],
  };

  const series = categoryData.map((item) => item.value);

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  if (categoryData.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <i className="fas fa-chart-pie text-4xl mb-3"></i>
        <p className="text-lg font-medium">Sem dados de categorias</p>
        <p className="text-sm mt-1">Adicione transações com categorias para visualizar</p>
      </div>
    );
  }

  const total = categoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-80">
            <Chart options={options} series={series} type="donut" height="100%" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
              Distribuição por Categoria
            </h4>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {categoryData.map((item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                          R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, percentage)}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                <i className="fas fa-chart-pie text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Categorizado</p>
                <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalyticsChart;
