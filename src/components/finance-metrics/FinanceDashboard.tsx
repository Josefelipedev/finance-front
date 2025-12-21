import React, { useEffect, useState } from 'react';
import FinanceMetrics from './FinanceMetrics';
import { DashboardData, FinanceSummary, useFinance } from '../../hooks/useFinance.ts';
import RecentActivity from './RecentActivity.tsx';
import FinanceTable from './ui/FinanceTable.tsx';

const FinanceDashboard: React.FC = () => {
  const { getDashboardData, getFinanceSummary, isLoading, error } = useFinance();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [summaryData, setSummaryData] = useState<FinanceSummary | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [activePeriod, setActivePeriod] = useState<'week' | 'month' | 'year' | 'custom'>('month');

  useEffect(() => {
    loadDashboardData();
    loadSummaryData();
  }, [dateRange, activePeriod]);

  const setPeriod = (period: 'week' | 'month' | 'year' | 'custom') => {
    setActivePeriod(period);

    const now = new Date();
    let start = new Date();

    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        return; // Mantém as datas customizadas
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    });
  };

  const loadDashboardData = async () => {
    try {
      const params = {
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      };
      const data = await getDashboardData(params);
      setDashboardData(data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  };

  const loadSummaryData = async () => {
    try {
      const params = {
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      };
      const data = await getFinanceSummary(params);
      setSummaryData(data);
    } catch (err) {
      console.error('Erro ao carregar resumo:', err);
    }
  };

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
    setActivePeriod('custom');
  };

  if (isLoading && !dashboardData && !summaryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData && !summaryData) {
    return (
      <div className="text-center py-8 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
          <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Erro ao carregar dados
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'Não foi possível carregar os dados financeiros.'}
        </p>
        <button
          onClick={() => {
            loadDashboardData();
            loadSummaryData();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Período de Filtro */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activePeriod === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Última Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activePeriod === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Último Mês
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activePeriod === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Último Ano
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange(e.target.value, dateRange.endDate)}
                className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
              />
              <span className="text-gray-500 dark:text-gray-400">até</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange(dateRange.startDate, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            {(dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  setActivePeriod('month');
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                title="Limpar filtros"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Métricas */}
      {summaryData && (
        <FinanceMetrics
          totalBalance={dashboardData?.totalBalance || 0}
          totalIncome={summaryData.totalGanhos}
          totalExpense={summaryData.totalDespesas}
          netBalance={summaryData.saldo}
          dateRange={dateRange}
        />
      )}

      {/* Gráfico e Tabela */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardData && dashboardData.transactions.length > 0 && (
          <>
            <div className="lg:col-span-2">
              <RecentActivity transactions={dashboardData.transactions} />
            </div>

            <div className="lg:col-span-2">
              <FinanceTable transactions={dashboardData.transactions} />
            </div>
          </>
        )}
      </div>

      {/* Estado vazio */}
      {dashboardData && dashboardData.transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <i className="fas fa-chart-line text-gray-400 dark:text-gray-500 text-3xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Nenhuma transação encontrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {dateRange.startDate || dateRange.endDate
              ? 'Não há transações no período selecionado.'
              : 'Comece adicionando sua primeira transação financeira.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
