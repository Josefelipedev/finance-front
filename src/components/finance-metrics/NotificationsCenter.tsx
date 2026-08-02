// src/components/finance-metrics/NotificationsCenter.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useBills, BillItem } from '../../hooks/useBills';
import { formatMoney } from '../../utils/currency';

const HORIZON_DAYS = 30; // janela de "contas a vencer"

/**
 * A lista vem de `GET /bills`, que é quem gera as ocorrências do mês, sabe o
 * que está em atraso e devolve a moeda de cada conta.
 *
 * Antes isto recalculava o vencimento a partir das recorrentes no browser:
 * ignorava contas avulsas, não sabia o que já tinha sido pago, não estimava
 * anuais e formatava tudo em BRL — um vencimento de 40 € aparecia como R$ 40,00.
 */
const NotificationsCenter: React.FC = () => {
  const { getBills } = useBills();

  const [items, setItems] = useState<BillItem[]>([]);
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
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;

      // Dois meses: uma janela de 30 dias a meio do mês atravessa o mês seguinte.
      const [current, upcoming] = await Promise.all([getBills(thisMonth), getBills(nextMonth)]);
      setItems([...(current?.items ?? []), ...(upcoming?.items ?? [])]);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      toast.error('Erro ao carregar notificações.');
    } finally {
      setIsLoading(false);
    }
  };

  /** Dias até o vencimento; negativo quando já venceu. */
  const daysUntil = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86_400_000);
  };

  const pending = useMemo(() => {
    const seen = new Set<number>();
    return items
      .filter((item) => item.status === 'pending')
      .filter((item) => {
        if (seen.has(item.id)) return false; // o mês seguinte repete atrasadas
        seen.add(item.id);
        return true;
      })
      .map((item) => ({ item, days: daysUntil(item.dueDate) }))
      .filter(({ days }) => days <= HORIZON_DAYS)
      .sort((a, b) => a.days - b.days);
  }, [items]);

  const dueLabel = (days: number) => {
    if (days < -1) return `Venceu há ${Math.abs(days)} dias`;
    if (days === -1) return 'Venceu ontem';
    if (days === 0) return 'Vence hoje';
    if (days === 1) return 'Vence amanhã';
    return `Vence em ${days} dias`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6">
        <div className="flex gap-3">
          <i className="fas fa-exclamation-circle text-error-500 text-xl mt-0.5"></i>
          <div className="min-w-0">
            <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">
              Erro ao carregar notificações
            </h3>
            <p className="text-error-600 dark:text-red-400 text-xs sm:text-sm mt-1">
              {error.message}
            </p>
            <button
              onClick={load}
              className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-500"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Notificações
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Contas em atraso e a vencer nos próximos {HORIZON_DAYS} dias
          </p>
        </div>
        {pending.length > 0 && (
          <span className="shrink-0 text-sm px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full font-medium">
            {pending.length}
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <i className="far fa-bell-slash text-4xl mb-3 opacity-40"></i>
          <p>Nenhuma conta a vencer nos próximos dias. Tudo em dia!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(({ item, days }) => {
            const late = days < 0;
            const urgent = days <= 1;
            const soon = days <= 7;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 bg-white dark:bg-gray-800 border rounded-xl p-4 shadow-sm ${
                  urgent
                    ? 'border-rose-300 dark:border-rose-700'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'income'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <i
                    className={`fas ${item.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}
                  ></i>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                    {item.description}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {item.categoryName || 'Sem categoria'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`font-bold ${
                      item.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-800 dark:text-white'
                    }`}
                  >
                    {formatMoney(item.amount, item.currency)}
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      late || urgent
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        : soon
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
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
