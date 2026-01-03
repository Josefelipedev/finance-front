import React, { useState } from 'react';
import MonthlyComparisonChart from './charts/MonthlyComparisonChart.tsx';
import CategoryAnalyticsChart from './charts/CategoryAnalyticsChart.tsx';
import TrendAnalyticsChart from './charts/TrendAnalyticsChart.tsx';

const AnalyticsView: React.FC<{ dateRange: { startDate: string; endDate: string } }> = ({
  dateRange,
}) => {
  const [activeChart, setActiveChart] = useState<'monthly' | 'category' | 'trend'>('monthly');

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveChart('monthly')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeChart === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <i className="fas fa-chart-bar mr-2"></i>
          Comparação Mensal
        </button>
        <button
          onClick={() => setActiveChart('category')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeChart === 'category'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <i className="fas fa-chart-pie mr-2"></i>
          Por Categoria
        </button>
        <button
          onClick={() => setActiveChart('trend')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeChart === 'trend'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <i className="fas fa-chart-line mr-2"></i>
          Tendência
        </button>
      </div>

      {/* Chart Area */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 shadow">
        {activeChart === 'monthly' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Receitas vs Despesas - Comparação Mensal
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Período: {dateRange.startDate} à {dateRange.endDate}
              </span>
            </div>
            <MonthlyComparisonChart dateRange={dateRange} />
          </div>
        )}

        {activeChart === 'category' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Distribuição por Categoria
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Análise de gastos por categoria
              </span>
            </div>
            <CategoryAnalyticsChart dateRange={dateRange} />
          </div>
        )}

        {activeChart === 'trend' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Tendência de Saldo
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Evolução do saldo ao longo do tempo
              </span>
            </div>
            <TrendAnalyticsChart dateRange={dateRange} />
          </div>
        )}
      </div>

      {/* Insights Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <i className="fas fa-lightbulb text-purple-600 dark:text-purple-400 text-xl"></i>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Recomendação Personalizada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Baseado na sua análise{' '}
              {activeChart === 'monthly'
                ? 'mensal'
                : activeChart === 'category'
                  ? 'por categoria'
                  : 'de tendência'}
              ,
              {activeChart === 'monthly'
                ? ' recomenda-se manter um equilíbrio entre receitas e despesas.'
                : activeChart === 'category'
                  ? ' considere revisar as categorias com maior gasto.'
                  : ' acompanhe a tendência do seu saldo para ajustar seus hábitos financeiros.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
