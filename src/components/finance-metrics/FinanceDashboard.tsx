import React, { useEffect, useState } from 'react';
import FinanceMetrics from './FinanceMetrics';
import { DashboardData, FinanceSummary, useFinance } from '../../hooks/useFinance.ts';
import FinanceTable from './ui/FinanceTable.tsx';

interface FinanceDashboardProps {
  dateRange: { startDate: string; endDate: string };
  setDateRange: (dateRange: { startDate: string; endDate: string }) => void;
}
const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ dateRange, setDateRange }) => {
  const { getDashboardData, getFinanceSummary, isLoading, error } = useFinance();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [summaryData, setSummaryData] = useState<FinanceSummary | null>(null);

  const [activePeriod, setActivePeriod] = useState<'week' | 'month' | 'year' | 'custom'>('month');

  useEffect(() => {
    loadDashboardData();
    loadSummaryData();
  }, [dateRange]);

  const setPeriod = (period: 'week' | 'month' | 'year' | 'custom') => {
    setActivePeriod(period);

    const now = new Date();
    const start = new Date();

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
      const params: any = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const data = await getDashboardData(params);
      setDashboardData(data);
    } catch (err) {
      // Não preenche com zeros: mantém null para o estado de erro aparecer
      // (senão o usuário vê "R$ 0,00" quando a API está fora).
      console.error('Erro ao carregar dashboard:', err);
      setDashboardData(null);
    }
  };

  const loadSummaryData = async () => {
    try {
      const params: any = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const data = await getFinanceSummary(params);
      setSummaryData(data);
    } catch (err) {
      // Mantém null para o estado de erro aparecer em vez de mostrar zeros falsos.
      console.error('Erro ao carregar resumo:', err);
      setSummaryData(null);
    }
  };

  if (isLoading && !dashboardData && !summaryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData && !summaryData) {
    return (
      <div className="text-center py-8 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
          <i className="fas fa-exclamation-triangle text-error-600 dark:text-red-400 text-2xl"></i>
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
          className="px-4 py-2 bg-brand-400 text-gray-950 font-medium rounded-lg hover:bg-brand-300 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 ">
      {/* Período de Filtro — controle segmentado */}
      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-white/[0.06] dark:bg-gray-800">
        {(
          [
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mês' },
            { id: 'year', label: 'Ano' },
          ] as const
        ).map((period) => (
          <button
            key={period.id}
            onClick={() => setPeriod(period.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activePeriod === period.id
                ? 'bg-brand-400 text-gray-950 shadow-theme-xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Métricas */}
      {summaryData && (
        <FinanceMetrics
          totalBalance={dashboardData?.totalBalance || 0}
          totalIncome={summaryData.totalGanhos}
          totalExpense={summaryData.totalDespesas}
          netBalance={summaryData.saldo}
          displayCurrency={summaryData.displayCurrency}
          rateDate={summaryData.rateDate}
          byCurrency={summaryData.byCurrency}
          dateRange={dateRange}
        />
      )}

      {/* Gráfico e Tabela */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardData && dashboardData.transactions.length > 0 && (
          <>
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
