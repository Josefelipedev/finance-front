// src/components/finance-metrics/TransactionsCalendar.tsx
import React, { useCallback, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type { DatesSetArg } from '@fullcalendar/core';
import { toast } from 'sonner';
import { useFinance } from '../../hooks/useFinance';
import type { FinanceRecord } from '../../types/finance';
import { Modal } from '../ui/modal';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const dayKey = (record: FinanceRecord) =>
  new Date(record.referenceDate || record.createdAt).toISOString().split('T')[0];

const TransactionsCalendar: React.FC = () => {
  const { getAllFinances } = useFinance();

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Recarrega ao mudar o intervalo visível (navegação de mês)
  const handleDatesSet = useCallback(
    async (arg: DatesSetArg) => {
      setIsLoading(true);
      try {
        const data = await getAllFinances({
          startDate: arg.start.toISOString(),
          endDate: arg.end.toISOString(),
        });
        setRecords(data || []);
      } catch {
        toast.error('Erro ao carregar o calendário.');
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Saldo diário (receita - despesa) por dia, como no app Android
  const dailyBalances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) {
      const key = dayKey(r);
      const delta = r.type === 'income' ? r.amount : -r.amount;
      map[key] = (map[key] || 0) + delta;
    }
    return map;
  }, [records]);

  const events = useMemo(
    () =>
      Object.entries(dailyBalances).map(([date, balance]) => ({
        start: date,
        allDay: true,
        title: formatCurrency(balance),
        color: balance >= 0 ? '#10b981' : '#f43f5e',
      })),
    [dailyBalances]
  );

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedDay(arg.dateStr);
  };

  const selectedTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return records.filter((r) => dayKey(r) === selectedDay);
  }, [selectedDay, records]);

  const selectedTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const r of selectedTransactions) {
      if (r.type === 'income') income += r.amount;
      else expense += r.amount;
    }
    return { income, expense };
  }, [selectedTransactions]);

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Calendário</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Visualize o saldo diário e clique em um dia para ver as transações
          </p>
        </div>
        {isLoading && (
          <i className="fas fa-spinner fa-spin text-sky-500" aria-label="Carregando"></i>
        )}
      </div>

      <div className="finance-calendar bg-white dark:bg-slate-800 rounded-xl p-2 sm:p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          events={events}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          height="auto"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          dayMaxEvents={2}
        />
      </div>

      {/* Detalhe do dia */}
      <Modal isOpen={Boolean(selectedDay)} onClose={() => setSelectedDay(null)} className="max-w-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">
            {selectedDay && new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <div className="flex gap-4 text-sm mb-4">
            <span className="text-emerald-600 dark:text-emerald-400">
              <i className="fas fa-arrow-down mr-1"></i>
              {formatCurrency(selectedTotals.income)}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              <i className="fas fa-arrow-up mr-1"></i>
              {formatCurrency(selectedTotals.expense)}
            </span>
          </div>

          {selectedTransactions.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-6">
              Nenhuma transação neste dia.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate">
                      {tx.description || 'Sem descrição'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {tx.category?.name || 'Sem categoria'}
                    </p>
                  </div>
                  <span
                    className={`font-semibold shrink-0 ${
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TransactionsCalendar;
