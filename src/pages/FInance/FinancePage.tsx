import React, { useState } from 'react';
import FinanceDashboard from '../../components/finance-metrics/FinanceDashboard.tsx';
import CategoryDistribution from '../../components/finance-metrics/CategoryDistribution.tsx';
import FinanceGoals from '../../components/finance-metrics/goals/FinanceGoals.tsx';
import TransactionsList from '../../components/finance-metrics/TransactionsList.tsx';
import AnalyticsView from '../../components/finance-metrics/AnalyticsView.tsx';
import AddFinanceModal from '../../components/finance-metrics/AddFinanceModal.tsx';
import DateRangePicker from '../../components/ui/date-range-picker';
import CategoryManager from '../../components/finance-metrics/categories/CategoryManager.tsx';
import RecurringManager from '../../components/finance-metrics/recurring/RecurringManager.tsx';
import ShoppingManager from '../../components/finance-metrics/shopping/ShoppingManager.tsx';

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'transactions' | 'analytics' | 'categories' | 'recurring' | 'shopping'
  >('dashboard');

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  });

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ start: startDate, end: endDate });
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSuccess = () => {
    console.log('Transação adicionada com sucesso!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                Dashboard Financeiro
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Gerencie suas finanças de forma inteligente
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              <div className="bg-white dark:bg-slate-700 rounded-lg shadow-sm p-1">
                <DateRangePicker
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onStartDateChange={(date) => setDateRange((prev) => ({ ...prev, start: date }))}
                  onEndDateChange={(date) => setDateRange((prev) => ({ ...prev, end: date }))}
                  startLabel=""
                  endLabel=""
                  className="w-full md:w-auto"
                />
              </div>

              <button className="px-4 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm flex items-center gap-2">
                <i className="fas fa-file-export"></i>
                <span>Exportar Relatório</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'dashboard'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <i className="fas fa-chart-line mr-2"></i>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'recurring'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <i className="fas fa-redo mr-2"></i>
              Recorrentes
            </button>
            <button
              onClick={() => setActiveTab('shopping')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'shopping'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <i className="fas fa-shopping-cart mr-2"></i>
              Compras
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'categories'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <i className="fas fa-tags mr-2"></i>
              Categorias
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'transactions'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <i className="fas fa-exchange-alt mr-2"></i>
              Transações
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'analytics'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
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
          <div className="space-y-6">
            <FinanceDashboard dateRange={dateRange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CategoryDistribution dateRange={dateRange} />
              <FinanceGoals />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Adicionar Transação
                </h3>
                <span className="text-xs px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full">
                  Rápido
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Clique no botão abaixo para adicionar uma nova transação financeira.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="fas fa-plus"></i>
                Nova Transação
              </button>
            </div>
          </div>
        )}
        {activeTab === 'shopping' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
              <div className="p-6">
                <ShoppingManager />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                    Todas as Transações
                  </h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Período: {new Date(dateRange.start).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(dateRange.end).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <TransactionsList dateRange={dateRange} />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'recurring' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
              <div className="p-6">
                <RecurringManager />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
              <div className="p-6">
                <CategoryManager />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                    Análises Detalhadas
                  </h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Período: {new Date(dateRange.start).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(dateRange.end).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <AnalyticsView dateRange={dateRange} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Insights Financeiros
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Receba recomendações personalizadas para melhorar suas finanças
                </p>
              </div>
              <button className="px-4 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm flex items-center gap-2">
                <i className="fas fa-lightbulb"></i>
                <span>Ver Insights</span>
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
