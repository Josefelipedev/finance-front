
// src/components/finance-metrics/CategoryDistribution.tsx
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useFinance } from '../../hooks/useFinance';

interface CategoryDistributionProps {
    dateRange: { start: string; end: string };
}

const CategoryDistribution: React.FC<CategoryDistributionProps> = ({ dateRange }) => {
    const { getRecords, isLoading } = useFinance();
    const [categoryData, setCategoryData] = useState<{ category: string; amount: number }[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const records = await getRecords({
                startDate: dateRange.start,
                endDate: dateRange.end,
            });

            // Simulação de agrupamento por categoria (você precisará ajustar isso com seus dados reais)
            const categories = records.reduce((acc: any, record) => {
                const category = record.categoryId || 'Sem Categoria';
                if (!acc[category]) {
                    acc[category] = 0;
                }
                acc[category] += record.amount;
                return acc;
            }, {});

            const formattedData = Object.entries(categories).map(([category, amount]) => ({
                category,
                amount: Math.abs(amount as number),
            })).slice(0, 5);

            setCategoryData(formattedData);
        };

        loadData();
    }, [dateRange]);

    const options: ApexOptions = {
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
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
                        },
                    },
                },
            },
        },
        labels: categoryData.map(item => item.category),
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
    };

    const series = categoryData.map(item => item.amount);

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
                    <Chart
                        options={options}
                        series={series}
                        type="donut"
                        height="100%"
                    />
                </div>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-chart-pie text-4xl mb-2"></i>
                    <p>Nenhuma transação no período</p>
                </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
                {categoryData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <div className="flex items-center">
                            <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: options.colors?.[index] as string || '#000' }}
                            ></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
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