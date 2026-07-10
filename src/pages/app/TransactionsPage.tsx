import { useState } from 'react';
import { toast } from 'sonner';
import TransactionsList from '../../components/finance-metrics/TransactionsList';
import DateRangePicker from '../../components/ui/date-range-picker';
import PageShell, { Surface } from '../../components/common/PageShell';
import { defaultDateRange } from '../../utils/date-range';
import { useFinance } from '../../hooks/useFinance';

export default function TransactionsPage() {
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [isExporting, setIsExporting] = useState(false);
  const { getAllFinances } = useFinance();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const records = await getAllFinances({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      if (!records || records.length === 0) {
        toast.info('Nenhuma transação no período para exportar.');
        return;
      }

      const header = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Moeda', 'Valor'].join(';');
      const rows = records.map((t) =>
        [
          new Date(t.referenceDate || t.createdAt).toLocaleDateString('pt-BR'),
          `"${(t.description || '').replace(/"/g, '""')}"`,
          t.type === 'income' ? 'Receita' : 'Despesa',
          `"${(t.category?.name || 'Sem categoria').replace(/"/g, '""')}"`,
          t.currency || 'BRL',
          t.amount.toFixed(2).replace('.', ','),
        ].join(';')
      );

      // BOM para o Excel reconhecer UTF-8
      const csv = '﻿' + [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const start = dateRange.startDate.split('T')[0];
      const end = dateRange.endDate.split('T')[0];
      link.href = url;
      link.download = `finploit-${start}_${end}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${records.length} transações exportadas com sucesso!`);
    } catch {
      toast.error('Erro ao exportar relatório.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageShell
      title="Transações"
      description={`Período: ${new Date(dateRange.startDate).toLocaleDateString('pt-BR')} – ${new Date(
        dateRange.endDate
      ).toLocaleDateString('pt-BR')}`}
      actions={
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-1 dark:border-white/[0.06] dark:bg-gray-800">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onStartDateChange={(date) => setDateRange((prev) => ({ ...prev, startDate: date }))}
              onEndDateChange={(date) => setDateRange((prev) => ({ ...prev, endDate: date }))}
              startLabel=""
              endLabel=""
            />
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/[0.06] dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-export'} text-xs`}></i>
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </>
      }
    >
      <Surface className="p-4 sm:p-6">
        <TransactionsList dateRange={dateRange} />
      </Surface>
    </PageShell>
  );
}
