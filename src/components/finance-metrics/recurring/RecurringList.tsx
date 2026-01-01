// src/components/finance-metrics/recurring/RecurringList.tsx
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8 text-center">
        <i className="fas fa-redo text-4xl text-slate-300 dark:text-slate-600 mb-3"></i>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          Nenhuma transação recorrente encontrada
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Comece criando sua primeira transação recorrente para automatizar seus pagamentos
        </p>
      </div>
    );
  }

  const formatFrequency = (frequency: string, dueDay?: number, weekDay?: number) => {
    switch (frequency) {
      case 'daily':
        return 'Diária';
      case 'weekly':
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return `Semanal (${days[weekDay || 0]})`;
      case 'monthly':
        return `Mensal (dia ${dueDay || 1})`;
      case 'yearly':
        return 'Anual';
      default:
        return frequency;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
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
                ></i>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-white">
                  {transaction.description}
                </h4>
                <div className="flex items-center gap-2 mt-1">
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
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                      <i className="fas fa-bell mr-1"></i>
                      Notificação
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(transaction)}
                className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg"
                title="Editar"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={() => onDelete(transaction.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Excluir"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Valor</p>
              <p
                className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(transaction.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Categoria</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {transaction.category?.name || 'Sem categoria'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Execuções</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {transaction.executedCount}
                {transaction.occurrences && ` / ${transaction.occurrences}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {formatCurrency(transaction.amount * transaction.executedCount)}
              </p>
            </div>
          </div>

          {transaction.endDate && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
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
