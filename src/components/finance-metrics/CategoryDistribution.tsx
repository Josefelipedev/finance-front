// src/components/finance-metrics/CategoryDistribution.tsx
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useFinance } from '../../hooks/useFinance';

interface CategoryDistributionProps {
  dateRange: { startDate: string; endDate: string };
}

interface CategoryItem {
  id: number;
  name: string;
  type: string;
  color: string;
  iconName: string;
  description: string;
  isActive: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface Record {
  id: number;
  type: string;
  description: string;
  currency: string;
  amount: number;
  userId: number;
  iconName: string;
  referenceDate: string;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  category: CategoryItem | null;
}

interface CategoryData {
  category: string;
  amount: number;
  name: string;
  color?: string;
}

const CategoryDistribution: React.FC<CategoryDistributionProps> = ({ dateRange }) => {
  const { getRecords, isLoading } = useFinance();
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const records = await getRecords({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      //Agrupamento por categoria
      const categories = records.reduce((acc: any, record) => {
        // Determina o nome da categoria
        let categoryName = 'Sem Categoria';
        let categoryColor = '#6B7280'; // Cor padrão para "Sem Categoria"

        if (record.category && record.category.name) {
          categoryName = record.category.name;
          categoryColor = record.category.color || categoryColor;
        }

        // Cria chave única para a categoria
        const categoryKey = categoryName;

        if (!acc[categoryKey]) {
          acc[categoryKey] = {
            category: categoryName,
            name: categoryName,
            amount: 0,
            color: categoryColor,
          };
        }

        // Soma o valor absoluto (remove negativo para despesas)
        acc[categoryKey].amount += Math.abs(record.amount);
        return acc;
      }, {});

      // Converte para array e ordena por valor (decrescente)
      const formattedData = Object.values(categories)
        .map((item: any) => ({
          category: item.category,
          name: item.name,
          amount: parseFloat(item.amount.toFixed(2)),
          color: item.color,
        }))
        .sort((a: CategoryData, b: CategoryData) => b.amount - a.amount)
        .slice(0, 5); // Pega as 5 maiores categorias

      setCategoryData(formattedData);
    };

    loadData();
  }, [dateRange]);

  // Cores para o gráfico - usa as cores das categorias ou padrão
  const getChartColors = () => {
    if (categoryData.length > 0 && categoryData.some((item) => item.color)) {
      return categoryData.map((item) => item.color || '#3B82F6');
    }
    return ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  };

  const options: ApexOptions = {
    colors: getChartColors(),
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: '#6B7280',
              formatter: function (w) {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return `R$ ${total.toFixed(2)}`;
              },
            },
          },
        },
      },
    },
    labels: categoryData.map((item) => item.category),
    legend: {
      position: 'bottom',
      fontFamily: 'Inter',
      fontSize: '12px',
      labels: {
        colors: '#6B7280',
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: function (value) {
          return `R$ ${value.toFixed(2)}`;
        },
      },
    },
  };

  const series = categoryData.map((item) => item.amount);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Distribuição por Categoria
      </h3>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : categoryData.length > 0 ? (
        <div className="h-64">
          <Chart options={options} series={series} type="donut" height="100%" />
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <i className="fas fa-chart-pie text-4xl mb-2"></i>
          <p>Nenhuma transação no período</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {categoryData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
          >
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor: item.color || (options.colors?.[index] as string) || '#000',
                }}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[100px]">
                {item.category}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              R$ {item.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryDistribution;
