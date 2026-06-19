// src/components/finance-metrics/NotificationsCenter.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRecurringFinance, RecurringTransaction } from '../../hooks/useRecurringFinance';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const HORIZON_DAYS = 30; // janela de "contas a vencer"

// Próxima ocorrência (em dias a partir de hoje) fiel ao app Android:
// para mensais, vence neste mês se o dia ainda não passou; senão no próximo.
function daysUntilDue(tx: RecurringTransaction): number | null {
  const now = new Date();
  const today = now.getDate();
  const dow = now.getDay();

  switch (tx.frequency) {
    case 'daily':
      return 0;

    case 'weekly': {
      if (tx.weekDay == null) return null;
      return (tx.weekDay - dow + 7) % 7;
    }

    case 'monthly': {
      if (tx.dueDay == null || tx.dueDay <= 0) return null;
      if (tx.dueDay >= today) {
        return tx.dueDay - today;
      }
      // próximo mês
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dueNext = Math.min(
        tx.dueDay,
        new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()
      );
      return daysInMonth - today + dueNext;
    }

    case 'yearly':
      return null; // sem mês definido no modelo — não estimável

    default:
      return null;
  }
}

const dueLabel = (days: number) => {
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  return `Vence em ${days} dias`;
};

const NotificationsCenter: React.FC = () => {
  const { getAllRecurringTransactions, isTransactionActive } = useRecurringFinance();

  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllRecurringTransactions();
      setTransactions(data || []);
    } catch (err) {
      setError(err as Error);
      toast.error('Erro ao carregar notificações.');
    } finally {
      setIsLoading(false);
    }
  };

  const upcoming = useMemo(() => {
    return transactions
      .filter((tx) => isTransactionActive(tx))
      .map((tx) => ({ tx, days: daysUntilDue(tx) }))
      .filter(
        (item): item is { tx: RecurringTransaction; days: number } =>
          item.days != null && item.days <= HORIZON_DAYS
      )
      .sort((a, b) => a.days - b.days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6">
        <div className="flex gap-3">
          <i className="fas fa-exclamation-circle text-red-500 text-xl mt-0.5"></i>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">
              Erro ao carregar notificações
            </h3>
            <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
            Notificações
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Contas e lançamentos recorrentes a vencer nos próximos {HORIZON_DAYS} dias
          </p>
        </div>
        {upcoming.length > 0 && (
          <span className="shrink-0 text-sm px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full font-medium">
            {upcoming.length}
          </span>
        )}
      </div>

      {/* Lista */}
      {upcoming.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <i className="far fa-bell-slash text-4xl mb-3 opacity-40"></i>
          <p>Nenhuma conta a vencer nos próximos dias. Tudo em dia!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(({ tx, days }) => {
            const urgent = days <= 1;
            const soon = days <= 7;
            return (
              <div
                key={tx.id}
                className={`flex items-center gap-4 bg-white dark:bg-slate-800 border rounded-xl p-4 shadow-sm ${
                  urgent
                    ? 'border-rose-300 dark:border-rose-700'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'income'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <i className={`fas ${tx.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                    {tx.description}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {tx.category?.name || 'Sem categoria'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`font-bold ${
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    {formatCurrency(tx.amount)}
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      urgent
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        : soon
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {dueLabel(days)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsCenter;
