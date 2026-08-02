import React, { useState } from 'react';
import { useAnalysis } from '../../hooks/useAnalysisData';
import MonthlyComparisonChart from './charts/MonthlyComparisonChart.tsx';
import CategoryAnalyticsChart from './charts/CategoryAnalyticsChart.tsx';
import TrendAnalyticsChart from './charts/TrendAnalyticsChart.tsx';

/**
 * As datas do período chegam como ISO completo ("2026-08-02T22:59:59.999Z"),
 * porque é assim que o seletor as manda para a API. Mostrar isso ao
 * utilizador é mostrar-lhe a mecânica interna — e ainda por cima com a hora
 * do fuso, que faz o dia parecer o anterior.
 */
const formatPeriodDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

const AnalyticsView: React.FC<{ dateRange: { startDate: string; endDate: string } }> = ({
  dateRange,
}) => {
  const [activeChart, setActiveChart] = useState<'monthly' | 'category' | 'trend'>('monthly');
  // Um pedido para os três gráficos: as somas vêm do servidor, que é onde
  // vivem — e onde já estavam a ser feitas para o Android.
  const { data, isLoading, error } = useAnalysis(dateRange);

  const vazio = (
    <div className="flex h-80 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
      <i className="fas fa-chart-bar mb-3 text-4xl"></i>
      <p className="text-lg font-medium">Sem dados disponíveis</p>
      <p className="mt-1 text-sm">Não há transações no período selecionado</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">A carregar…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-80 flex-col items-center justify-center text-error-500 dark:text-red-400">
        <i className="fas fa-exclamation-triangle mb-3 text-4xl"></i>
        <p className="text-lg font-medium">Erro ao carregar a análise</p>
        <p className="mt-1 px-4 text-center text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveChart('monthly')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeChart === 'monthly'
              ? 'bg-brand-400 text-gray-950'
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
              ? 'bg-brand-400 text-gray-950'
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
              ? 'bg-brand-400 text-gray-950'
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
                Período: {formatPeriodDate(dateRange.startDate)} à{' '}
                {formatPeriodDate(dateRange.endDate)}
              </span>
            </div>
            {data ? (
              <MonthlyComparisonChart
                timeSeries={data.Monthly}
                displayCurrency={data.displayCurrency}
              />
            ) : (
              vazio
            )}
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
            {data ? (
              <CategoryAnalyticsChart
                categories={data.categorySummary}
                displayCurrency={data.displayCurrency}
              />
            ) : (
              vazio
            )}
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
            {data ? (
              <TrendAnalyticsChart daily={data.Daily} displayCurrency={data.displayCurrency} />
            ) : (
              vazio
            )}
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
