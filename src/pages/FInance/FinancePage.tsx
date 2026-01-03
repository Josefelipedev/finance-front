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
import { toast } from 'sonner';

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'transactions' | 'analytics' | 'categories' | 'recurring' | 'shopping'
  >('dashboard');

  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    endDate: new Date().toISOString(),
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSuccess = () => {
    toast.success('Transação adicionada com sucesso!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                Dashboard Financeiro
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                Gerencie suas finanças de forma inteligente
              </p>
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full md:w-auto">
              <div className="bg-white dark:bg-slate-700 rounded-lg shadow-sm p-1 flex-grow">
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onStartDateChange={(date) => setDateRange((prev) => ({ ...prev, start: date }))}
                  onEndDateChange={(date) => setDateRange((prev) => ({ ...prev, end: date }))}
                  startLabel=""
                  endLabel=""
                  className="w-full"
                />
              </div>

              <button className="px-3 sm:px-4 py-2 sm:py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap">
                <i className="fas fa-file-export text-sm"></i>
                <span className="hidden xs:inline">Exportar Relatório</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="relative">
            {/* Container com scroll horizontal */}
            <div className="overflow-x-auto py-2 scrollbar-custom">
              <div className="flex space-x-1 sm:space-x-2 md:space-x-6 min-w-max pb-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
                  { id: 'recurring', label: 'Recorrentes', icon: 'redo' },
                  { id: 'shopping', label: 'Compras', icon: 'shopping-cart' },
                  { id: 'categories', label: 'Categorias', icon: 'tags' },
                  { id: 'transactions', label: 'Transações', icon: 'exchange-alt' },
                  { id: 'analytics', label: 'Análises', icon: 'chart-pie' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 sm:px-4 py-2 sm:py-3 font-medium border-b-2 transition-colors flex items-center whitespace-nowrap text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                  >
                    <i className={`fas fa-${tab.icon} mr-1 sm:mr-2 text-xs sm:text-sm`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sombra no lado direito para indicar scroll (opcional) */}
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-800 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            <FinanceDashboard dateRange={dateRange} setDateRange={setDateRange} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="lg:col-span-1">
                <CategoryDistribution dateRange={dateRange} />
              </div>
              <div className="lg:col-span-1">
                <FinanceGoals />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Adicionar Transação
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 sm:mt-0">
                    Clique no botão abaixo para adicionar uma nova transação financeira.
                  </p>
                </div>
                <span className="self-start sm:self-center text-xs px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full">
                  Rápido
                </span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base"
              >
                <i className="fas fa-plus"></i>
                Nova Transação
              </button>
            </div>
          </div>
        )}

        {activeTab === 'shopping' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
              <div className="p-4 sm:p-6">
                <ShoppingManager />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                    Todas as Transações
                  </h2>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Período: {new Date(dateRange.startDate).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(dateRange.endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <TransactionsList dateRange={dateRange} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recurring' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
              <div className="p-4 sm:p-6">
                <RecurringManager />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
              <div className="p-4 sm:p-6">
                <CategoryManager />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                    Análises Detalhadas
                  </h2>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Período: {new Date(dateRange.startDate).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(dateRange.endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <AnalyticsView dateRange={dateRange} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 sm:pt-6">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Insights Financeiros
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Receba recomendações personalizadas para melhorar suas finanças
                </p>
              </div>
              <button className="px-3 sm:px-4 py-2 sm:py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm sm:text-base w-full md:w-auto">
                <i className="fas fa-lightbulb text-sm"></i>
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
