import React, { useEffect, useState } from 'react';
import RecentActivity from '../../components/finance-metrics/RecentActivity.tsx';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import FinanceMetrics from '../../components/finance-metrics/FinanceMetrics.tsx';
import FinanceDashboard from '../../components/finance-metrics/FinanceDashboard.tsx';
import CategoryDistribution from '../../components/finance-metrics/CategoryDistribution.tsx';
import FinanceGoals from '../../components/finance-metrics/goals/FinanceGoals.tsx';
import QuickSummary from '../../components/finance-metrics/QuickSummary.tsx';
import TransactionsList from '../../components/finance-metrics/TransactionsList.tsx';
import AnalyticsView from '../../components/finance-metrics/AnalyticsView.tsx';
import AddFinanceModal from '../../components/finance-metrics/AddFinanceModal.tsx';

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'analytics'>(
    'dashboard'
  );
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };
  const handleSuccess = () => {
    console.log('Transação adicionada com sucesso!');
    // Aqui você pode atualizar os dados da página se necessário
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                Dashboard Financeiro
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerencie suas finanças de forma inteligente
              </p>
            </div>

            <div className="flex items-center gap-3">
              <DateRangePicker
                startDate={dateRange.start}
                endDate={dateRange.end}
                onChange={handleDateRangeChange}
              />

              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Exportar Relatório
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <i className="fas fa-chart-line mr-2"></i>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <i className="fas fa-exchange-alt mr-2"></i>
              Transações
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <i className="fas fa-chart-pie mr-2"></i>
              Análises
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <>
            {/* Top Metrics */}
            <div className="mb-6">
              <FinanceMetrics
                dateRange={dateRange}
                onMetricsLoaded={(data) => console.log('Métricas carregadas:', data)}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Charts & Dashboard */}
              <div className="lg:col-span-2 space-y-6">
                <FinanceDashboard dateRange={dateRange} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CategoryDistribution dateRange={dateRange} />
                  <FinanceGoals />
                </div>
              </div>

              {/* Right Column - Forms & Summary */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Adicionar Transação
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Clique no botão abaixo para adicionar uma nova transação financeira.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-plus"></i>
                    Nova Transação
                  </button>
                </div>
                <QuickSummary dateRange={dateRange} />

                <RecentActivity limit={5} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Todas as Transações
                </h2>
                <TransactionsList dateRange={dateRange} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Análises Detalhadas
                </h2>
                <AnalyticsView dateRange={dateRange} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Insights Financeiros
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Receba recomendações personalizadas para melhorar suas finanças
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Ver Insights
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddFinanceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          handleSuccess();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};

export default FinancePage;
