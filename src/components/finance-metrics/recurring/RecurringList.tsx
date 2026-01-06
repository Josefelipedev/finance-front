import React from 'react';
import { RecurringTransaction } from '../../../hooks/useRecurringFinance';

interface RecurringListProps {
  transactions: RecurringTransaction[];
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (id: number) => void;
}

const RecurringList: React.FC<RecurringListProps> = ({ transactions, onEdit, onDelete }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 text-center">
        <i className="fas fa-redo text-4xl text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
          Nenhuma transação recorrente encontrada
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Crie sua primeira transação recorrente para automatizar seus pagamentos
        </p>
      </div>
    );
  }

  const formatFrequency = (frequency: string, dueDay?: number, weekDay?: number) => {
    switch (frequency) {
      case 'daily':
        return 'Diária';
      case 'weekly': {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return `Semanal (${days[weekDay || 0]})`;
      }
      case 'monthly':
        return `Mensal (dia ${dueDay || 1})`;
      case 'yearly':
        return 'Anual';
      default:
        return frequency;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4"
        >
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  transaction.type === 'income'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                <i
                  className={`fas ${
                    transaction.type === 'income'
                      ? 'fa-arrow-up text-green-600'
                      : 'fa-arrow-down text-red-600'
                  }`}
                />
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 dark:text-white leading-tight">
                  {transaction.description}
                </h4>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      transaction.type === 'income'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                  </span>

                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {formatFrequency(
                      transaction.frequency,
                      transaction.dueDay,
                      transaction.weekDay
                    )}
                  </span>

                  {transaction.notification && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                      <i className="fas fa-bell" />
                      Notificação
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:gap-1 self-end sm:self-auto">
              <button
                onClick={() => onEdit(transaction)}
                className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                title="Editar"
              >
                <i className="fas fa-edit" />
              </button>
              <button
                onClick={() => onDelete(transaction.id)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Excluir"
              >
                <i className="fas fa-trash" />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Valor</p>
              <p
                className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Categoria</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {transaction.category?.name || 'Sem categoria'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Execuções</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {transaction.executedCount}
                {transaction.occurrences && ` / ${transaction.occurrences}`}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {formatCurrency(transaction.amount * transaction.executedCount)}
              </p>
            </div>
          </div>

          {transaction.endDate && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Finaliza em: {new Date(transaction.endDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RecurringList;
