import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useFinance } from '../../hooks/useFinance';
import { useAnalysis, type InsightResponse } from '../../hooks/useAnalysis';
import { useUserProfile } from '../../hooks/useUserProfile';
import MixedCurrencyWarning from '../common/MixedCurrencyWarning';
import { Surface } from '../common/PageShell';
import { formatMoney } from '../../utils/currency';
import type { FinanceRecord } from '../../types/finance';
import Button from '../ui/button/Button';
import { countableType, typeLabel } from '../../utils/finance-type';
import { formatCivilDate } from '../../utils/civil-date';
import {
  CashFlowChart,
  CategoryReportChart,
  DailyBalanceChart,
  type CategoryReportPoint,
  type MonthlyReportPoint,
} from './ReportCharts';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const SHORT_MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];
const pad = (value: number) => String(value).padStart(2, '0');
const keyOf = (year: number, month: number) => `${year}-${pad(month + 1)}`;

/** Datas civis: o servidor transforma o primeiro e o último dia nos limites UTC. */
const reportBounds = (year: number, month: number) => {
  const historyStart = new Date(Date.UTC(year, month - 5, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return {
    startDate: `${historyStart.getUTCFullYear()}-${pad(historyStart.getUTCMonth() + 1)}-01`,
    endDate: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  };
};

const selectedMonthBounds = (year: number, month: number) => {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return {
    startDate: `${year}-${pad(month + 1)}-01`,
    endDate: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  };
};

const recordMonth = (record: FinanceRecord) =>
  (record.referenceDate || record.createdAt).slice(0, 7);
const recordDay = (record: FinanceRecord) =>
  Number((record.referenceDate || record.createdAt).slice(8, 10));
const convertedValue = (record: FinanceRecord) => record.convertedAmount ?? record.amount;
const percentageChange = (current: number, previous: number) =>
  previous > 0 ? ((current - previous) / previous) * 100 : null;

function ChangeLabel({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value == null) return <span>sem base no mês anterior</span>;
  const positive = value > 0;
  const favorable = inverse ? !positive : positive;
  return (
    <span
      className={
        favorable ? 'text-success-600 dark:text-success-400' : 'text-error-500 dark:text-error-400'
      }
    >
      <i className={`fas fa-arrow-${positive ? 'up' : value < 0 ? 'down' : 'right'} mr-1`} />
      {Math.abs(value).toFixed(0)}% vs. mês anterior
    </span>
  );
}

export default function MonthlyReport() {
  const { getAllFinances, listMeta } = useFinance();
  const { getInsight, isLoading: insightLoading } = useAnalysis();
  const { profile, getProfile } = useUserProfile();
  const [now] = useState(() => new Date());
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayCurrency = listMeta?.displayCurrency ?? profile?.currency;
  const formatCurrency = (value: number) => formatMoney(value, displayCurrency);
  const selectedKey = keyOf(year, month);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const isCouple = Boolean(profile?.isMarried && profile.spouseId);

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    setError(null);
    setInsight(null);
    getAllFinances(reportBounds(year, month))
      .then((data) => {
        if (alive) setRecords(data || []);
      })
      .catch((err: Error) => {
        if (!alive) return;
        setRecords([]);
        setError(err.message || 'Não foi possível carregar o relatório.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [getAllFinances, month, year]);

  const report = useMemo(() => {
    const months: Array<{ year: number; month: number; key: string }> = [];
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(Date.UTC(year, month - offset, 1));
      months.push({
        year: date.getUTCFullYear(),
        month: date.getUTCMonth(),
        key: keyOf(date.getUTCFullYear(), date.getUTCMonth()),
      });
    }

    const monthTotals = new Map<string, { income: number; expense: number }>();
    const categories = new Map<string, number>();
    const daily = new Map<number, { income: number; expense: number }>();
    const owners = new Map<number, { income: number; expense: number }>();
    let uncategorized = 0;

    for (const record of records) {
      const type = countableType(record.type);
      if (!type) continue;
      const value = convertedValue(record);
      const key = recordMonth(record);
      const totals = monthTotals.get(key) ?? { income: 0, expense: 0 };
      totals[type] += value;
      monthTotals.set(key, totals);

      if (key !== selectedKey) continue;
      const owner = owners.get(record.userId) ?? { income: 0, expense: 0 };
      owner[type] += value;
      owners.set(record.userId, owner);

      const day = recordDay(record);
      const dayTotals = daily.get(day) ?? { income: 0, expense: 0 };
      dayTotals[type] += value;
      daily.set(day, dayTotals);

      if (type === 'expense') {
        const category = record.category?.name || 'Sem categoria';
        categories.set(category, (categories.get(category) ?? 0) + value);
        if (!record.category?.name) uncategorized += value;
      }
    }

    const monthly: MonthlyReportPoint[] = months.map((item) => {
      const totals = monthTotals.get(item.key) ?? { income: 0, expense: 0 };
      return {
        label: `${SHORT_MONTHS[item.month]}${item.year !== year ? `/${String(item.year).slice(-2)}` : ''}`,
        income: totals.income,
        expense: totals.expense,
        balance: totals.income - totals.expense,
      };
    });
    const selected = monthly[monthly.length - 1] ?? { income: 0, expense: 0, balance: 0 };
    const previous = monthly[monthly.length - 2] ?? { income: 0, expense: 0, balance: 0 };
    const categoryRows = [...categories.entries()]
      .map(([name, value]) => ({
        name,
        value,
        pct: selected.expense > 0 ? (value / selected.expense) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
    const topFive = categoryRows.slice(0, 5);
    const otherValue = categoryRows.slice(5).reduce((sum, item) => sum + item.value, 0);
    const categoryChart: CategoryReportPoint[] = [
      ...topFive.map(({ name, value }) => ({ name, value })),
      ...(otherValue > 0 ? [{ name: 'Outras', value: otherValue }] : []),
    ];

    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const lastVisibleDay = isCurrentMonth ? now.getDate() : daysInMonth;
    let cumulative = 0;
    const dailyBalance = Array.from({ length: lastVisibleDay }, (_, index) => {
      const day = index + 1;
      const totals = daily.get(day) ?? { income: 0, expense: 0 };
      cumulative += totals.income - totals.expense;
      return { label: pad(day), balance: cumulative };
    });
    const selectedRecords = records.filter((record) => recordMonth(record) === selectedKey);
    const largestExpenses = selectedRecords
      .filter((record) => countableType(record.type) === 'expense')
      .sort((a, b) => convertedValue(b) - convertedValue(a))
      .slice(0, 5);

    return {
      monthly,
      selected,
      previous,
      selectedRecords,
      categoryRows,
      categoryChart,
      dailyBalance,
      largestExpenses,
      owners: [...owners.entries()].map(([userId, totals]) => ({ userId, ...totals })),
      uncategorized,
      daysInMonth,
    };
  }, [isCurrentMonth, month, now, records, selectedKey, year]);

  const incomeChange = percentageChange(report.selected.income, report.previous.income);
  const expenseChange = percentageChange(report.selected.expense, report.previous.expense);
  const savingsRate =
    report.selected.income > 0 ? (report.selected.balance / report.selected.income) * 100 : null;
  const elapsedDays = isCurrentMonth ? now.getDate() : report.daysInMonth;
  const projectedExpense =
    isCurrentMonth && elapsedDays > 0
      ? (report.selected.expense / elapsedDays) * report.daysInMonth
      : null;

  const ownerName = (userId: number) => {
    if (profile?.id === userId) return profile.displayName || profile.name;
    if (profile?.spouse?.id === userId) return profile.spouse.name;
    return `Pessoa #${userId}`;
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((value) => value - 1);
    } else setMonth((value) => value - 1);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 11) {
      setMonth(0);
      setYear((value) => value + 1);
    } else setMonth((value) => value + 1);
  };

  const handleExport = () => {
    if (report.selectedRecords.length === 0) {
      toast.info('Nenhuma transação neste mês para exportar.');
      return;
    }
    const header = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Moeda'].join(';');
    const rows = report.selectedRecords.map((record) =>
      [
        formatCivilDate(record.referenceDate || record.createdAt),
        `"${(record.description || '').replace(/"/g, '""')}"`,
        typeLabel(record.type),
        `"${(record.category?.name || 'Sem categoria').replace(/"/g, '""')}"`,
        record.amount.toFixed(2).replace('.', ','),
        record.currency || displayCurrency || '',
      ].join(';')
    );
    const blob = new Blob(['﻿' + [header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${selectedKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado.');
  };

  const handleInsight = async () => {
    try {
      const response = await getInsight(selectedMonthBounds(year, month));
      setInsight(response);
    } catch {
      toast.error('Não foi possível gerar a análise financeira.');
    }
  };

  const semTaxa = listMeta?.unconvertedCurrencies ?? [];
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5 sm:space-y-6">
      <Surface className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {MONTH_NAMES[month]} {year}
              </h2>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <i className={`fas fa-${isCouple ? 'people-roof' : 'user'} mr-1.5`} />
                {isCouple
                  ? `Dados do casal${profile?.spouse?.name ? ` · ${profile.displayName || profile.name} e ${profile.spouse.name}` : ''}`
                  : 'Dados individuais'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Valores realizados; transferências entre contas e metas não contam como despesa.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="h-10 w-10 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              aria-label="Mês anterior"
            >
              <i className="fas fa-chevron-left" />
            </button>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="h-10 w-10 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              aria-label="Mês seguinte"
            >
              <i className="fas fa-chevron-right" />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              startIcon={<i className="fas fa-download" />}
            >
              Exportar
            </Button>
          </div>
        </div>
      </Surface>

      {semTaxa.length > 0 ? (
        <MixedCurrencyWarning
          currencies={semTaxa}
          outOfRange={listMeta?.outOfRangeDates}
          rateDate={listMeta?.rateDate}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Receitas"
              value={formatCurrency(report.selected.income)}
              icon="arrow-trend-up"
              tone="success"
            >
              <ChangeLabel value={incomeChange} />
            </MetricCard>
            <MetricCard
              label="Despesas"
              value={formatCurrency(report.selected.expense)}
              icon="arrow-trend-down"
              tone="danger"
            >
              <ChangeLabel value={expenseChange} inverse />
            </MetricCard>
            <MetricCard
              label="Saldo do mês"
              value={formatCurrency(report.selected.balance)}
              icon="scale-balanced"
              tone={report.selected.balance >= 0 ? 'brand' : 'danger'}
            >
              receitas menos despesas
            </MetricCard>
            <MetricCard
              label="Taxa de poupança"
              value={savingsRate == null ? '—' : `${savingsRate.toFixed(1)}%`}
              icon="piggy-bank"
              tone={savingsRate != null && savingsRate >= 0 ? 'brand' : 'danger'}
            >
              {savingsRate == null ? 'sem receitas no período' : 'percentual da receita que sobrou'}
            </MetricCard>
          </div>

          {report.selectedRecords.length === 0 ? (
            <EmptyMonth />
          ) : (
            <>
              <Surface className="p-4 sm:p-6">
                <SectionHeading
                  title="Evolução dos últimos 6 meses"
                  description="Receitas, despesas e saldo realizados na mesma moeda de exibição."
                />
                <CashFlowChart points={report.monthly} currency={displayCurrency} />
              </Surface>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <Surface className="p-4 sm:p-6">
                  <SectionHeading
                    title="Para onde foi o dinheiro"
                    description="As cinco maiores categorias; o restante é agrupado em “Outras”."
                  />
                  {report.categoryChart.length > 0 && (
                    <CategoryReportChart points={report.categoryChart} currency={displayCurrency} />
                  )}
                  <div className="mt-2 space-y-3">
                    {report.categoryRows.slice(0, 5).map((category) => (
                      <div key={category.name}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="truncate text-gray-700 dark:text-gray-300">
                            {category.name}
                          </span>
                          <span className="shrink-0 font-medium tabular-nums text-gray-900 dark:text-white">
                            {formatCurrency(category.value)} · {category.pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${Math.min(category.pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>

                <Surface className="p-4 sm:p-6">
                  <SectionHeading
                    title="Leitura do mês"
                    description="Conclusões calculadas, sem depender de IA."
                  />
                  <div className="mt-5 space-y-4">
                    <Finding icon="wallet" title="Capacidade de poupança">
                      {savingsRate == null
                        ? 'Não houve receita registrada para calcular quanto sobrou.'
                        : report.selected.balance >= 0
                          ? `Sobrou ${formatCurrency(report.selected.balance)}, equivalente a ${savingsRate.toFixed(1)}% das receitas.`
                          : `As despesas ultrapassaram as receitas em ${formatCurrency(Math.abs(report.selected.balance))}.`}
                    </Finding>
                    <Finding icon="chart-column" title="Comparação com o mês anterior">
                      {expenseChange == null
                        ? 'O mês anterior não tem despesas suficientes para uma comparação.'
                        : `As despesas ${expenseChange > 0 ? 'aumentaram' : expenseChange < 0 ? 'diminuíram' : 'ficaram estáveis'} ${Math.abs(expenseChange).toFixed(0)}%.`}
                    </Finding>
                    {report.categoryRows[0] && (
                      <Finding icon="tags" title="Maior concentração">
                        {report.categoryRows[0].name} consumiu{' '}
                        {report.categoryRows[0].pct.toFixed(0)}% das despesas (
                        {formatCurrency(report.categoryRows[0].value)}).
                      </Finding>
                    )}
                    {projectedExpense != null && report.selected.expense > 0 && (
                      <Finding icon="gauge-high" title="Ritmo até ao fim do mês">
                        Mantido o ritmo médio até hoje, as despesas fechariam perto de{' '}
                        {formatCurrency(projectedExpense)}. É uma projeção linear, não uma conta
                        futura confirmada.
                      </Finding>
                    )}
                    {report.uncategorized > 0 && (
                      <Finding icon="triangle-exclamation" title="Dados por organizar">
                        {formatCurrency(report.uncategorized)} (
                        {((report.uncategorized / report.selected.expense) * 100).toFixed(0)}%) está
                        sem categoria e reduz a qualidade da análise.
                      </Finding>
                    )}
                  </div>
                </Surface>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <Surface className="p-4 sm:p-6">
                  <SectionHeading
                    title="Saldo ao longo do mês"
                    description="Acumulação diária de receitas menos despesas, começando em zero."
                  />
                  <DailyBalanceChart points={report.dailyBalance} currency={displayCurrency} />
                </Surface>
                <Surface className="p-4 sm:p-6">
                  <SectionHeading
                    title="Maiores despesas"
                    description="Os lançamentos com maior impacto no mês."
                  />
                  <div className="mt-4 divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {report.largestExpenses.map((record, index) => (
                      <div key={record.id} className="flex items-center gap-3 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                            {record.description || 'Sem descrição'}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {record.category?.name || 'Sem categoria'} ·{' '}
                            {formatCivilDate(record.referenceDate || record.createdAt)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-error-500 dark:text-error-400">
                          {formatCurrency(convertedValue(record))}
                        </span>
                      </div>
                    ))}
                  </div>
                </Surface>
              </div>

              {isCouple && report.owners.length > 0 && (
                <Surface className="p-4 sm:p-6">
                  <SectionHeading
                    title="Participação do casal"
                    description="Quem registrou as receitas e despesas incluídas neste relatório."
                  />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {report.owners.map((owner) => (
                      <div
                        key={owner.userId}
                        className="rounded-xl border border-gray-200 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ownerName(owner.userId)}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Receitas</span>
                          <span className="font-medium text-success-600 dark:text-success-400">
                            {formatCurrency(owner.income)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Despesas</span>
                          <span className="font-medium text-error-500 dark:text-error-400">
                            {formatCurrency(owner.expense)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>
              )}

              <Surface className="overflow-hidden">
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-50 to-blue-50 p-4 dark:border-white/[0.06] dark:from-brand-500/10 dark:to-blue-500/10 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          <i className="fas fa-wand-magic-sparkles mr-2 text-brand-500" />
                          Análise financeira por IA
                        </h3>
                        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                          {isCouple ? 'Inclui o casal' : 'Individual'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        A IA recebe o período, o âmbito e os totais calculados acima.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleInsight}
                      disabled={insightLoading}
                      startIcon={
                        <i
                          className={`fas fa-${insightLoading ? 'spinner fa-spin' : 'sparkles'}`}
                        />
                      }
                    >
                      {insight ? 'Atualizar análise' : 'Analisar mês'}
                    </Button>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  {insight ? (
                    <div>
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        {insight.scopeLabel} · {insight.periodLabel}
                      </p>
                      <p className="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">
                        {insight.insight}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Clique em “Analisar mês” para receber uma leitura objetiva das categorias, do
                      saldo e da capacidade de poupança.
                    </p>
                  )}
                </div>
              </Surface>
            </>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
  children,
}: {
  label: string;
  value: string;
  icon: string;
  tone: 'success' | 'danger' | 'brand';
  children: ReactNode;
}) {
  const tones = {
    success: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
    danger: 'bg-error-50 text-error-500 dark:bg-error-500/10 dark:text-error-400',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
  };
  return (
    <Surface className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <i className={`fas fa-${icon}`} />
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{children}</p>
    </Surface>
  );
}

function Finding({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
        <i className={`fas fa-${icon} text-xs`} />
      </span>
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{title}</p>
        <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">{children}</p>
      </div>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <Surface className="flex min-h-80 items-center justify-center p-8">
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-brand-500" />
        A preparar o relatório…
      </div>
    </Surface>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Surface className="p-8 text-center">
      <i className="fas fa-exclamation-triangle text-2xl text-error-500" />
      <p className="mt-3 font-medium text-gray-900 dark:text-white">Erro ao carregar o relatório</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </Surface>
  );
}

function EmptyMonth() {
  return (
    <Surface className="p-10 text-center">
      <i className="fas fa-calendar-xmark text-3xl text-gray-300 dark:text-gray-600" />
      <p className="mt-3 font-medium text-gray-900 dark:text-white">Sem movimentos neste mês</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Escolha outro mês para consultar receitas, despesas e padrões.
      </p>
    </Surface>
  );
}
