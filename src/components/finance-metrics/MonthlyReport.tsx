// src/components/finance-metrics/MonthlyReport.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useFinance } from '../../hooks/useFinance';
import { useAnalysis } from '../../hooks/useAnalysis';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { formatMoney, convertAmount } from '../../utils/currency';
import type { FinanceRecord } from '../../types/finance';
import Button from '../ui/button/Button';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const recordCurrency = (record: FinanceRecord) =>
  (record as { currency?: string }).currency;

const monthBounds = (year: number, month: number) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const MonthlyReport: React.FC = () => {
  const { getAllFinances } = useFinance();
  const { getInsight, isLoading: insightLoading } = useAnalysis();
  const { profile, getProfile } = useUserProfile();
  const displayCurrency = profile?.currency;
  const rates = useExchangeRates();

  // Totais agregados são formatados na moeda de exibição do usuário
  const formatCurrency = (value: number) => formatMoney(value, displayCurrency);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  useEffect(() => {
    load();
    setInsight(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getAllFinances(monthBounds(year, month));
      setRecords(data || []);
    } catch {
      setRecords([]);
      toast.error('Erro ao carregar o relatório.');
    } finally {
      setIsLoading(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const { income, expense, balance, byCategory } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const cats: Record<string, number> = {};
    for (const r of records) {
      // Converte para a moeda de exibição antes de somar
      // (registros do casal podem estar em BRL e EUR misturados)
      const amount = convertAmount(r.amount, recordCurrency(r), displayCurrency, rates);
      if (r.type === 'income') {
        inc += amount;
      } else {
        exp += amount;
        const name = r.category?.name || 'Sem categoria';
        cats[name] = (cats[name] || 0) + amount;
      }
    }
    const byCategory = Object.entries(cats)
      .map(([name, value]) => ({ name, value, pct: exp > 0 ? (value / exp) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
    return { income: inc, expense: exp, balance: inc - exp, byCategory };
  }, [records, rates, displayCurrency]);

  const handleExport = () => {
    if (records.length === 0) {
      toast.info('Nenhuma transação neste mês para exportar.');
      return;
    }
    const header = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor (R$)'].join(';');
    const rows = records.map((t) =>
      [
        new Date(t.referenceDate || t.createdAt).toLocaleDateString('pt-BR'),
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.type === 'income' ? 'Receita' : 'Despesa',
        `"${(t.category?.name || 'Sem categoria').replace(/"/g, '""')}"`,
        t.amount.toFixed(2).replace('.', ','),
      ].join(';')
    );
    const csv = '﻿' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${year}-${String(month + 1).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado!');
  };

  const handleInsight = async () => {
    try {
      const text = await getInsight();
      setInsight(text || 'Sem insight disponível no momento.');
    } catch {
      toast.error('Erro ao gerar insight.');
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header + navegação */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Relatório Mensal
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Resumo das suas receitas e despesas mês a mês
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Mês anterior"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <span className="min-w-[140px] text-center font-medium text-gray-800 dark:text-white">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Próximo mês"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          <Button
            variant="primary"
            type="button"
            size="sm"
            onClick={handleExport}
            startIcon={<i className="fas fa-file-export"></i>}
            className="ml-1 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-brand-500" />
        </div>
      ) : (
        <>
          {/* Resumo do mês */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Receitas</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(income)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Despesas</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(expense)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Balanço</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  balance < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-800 dark:text-white'
                }`}
              >
                {formatCurrency(balance)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{records.length} transações</p>
            </div>
          </div>

          {/* Despesas por categoria */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
              Despesas por categoria
            </h3>
            {byCategory.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                Nenhuma despesa registrada neste mês.
              </p>
            ) : (
              <div className="space-y-4">
                {byCategory.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <span className="text-gray-800 dark:text-white font-medium">
                        {formatCurrency(cat.value)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cat.pct.toFixed(0)}% das despesas
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insight IA */}
          <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-brand-100 dark:border-gray-700 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <i className="fas fa-wand-magic-sparkles text-brand-500"></i>
                Insight Financeiro (IA)
              </h3>
              <button
                onClick={handleInsight}
                disabled={insightLoading}
                className="px-3 py-2 bg-brand-400 text-gray-950 rounded-lg hover:bg-brand-300 transition-colors text-sm flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
              >
                {insightLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-bolt"></i>
                )}
                {insight ? 'Atualizar' : 'Gerar'}
              </button>
            </div>
            {insight ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {insight}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gere um comentário inteligente sobre suas finanças dos últimos 30 dias.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyReport;
