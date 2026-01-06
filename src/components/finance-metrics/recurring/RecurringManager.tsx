// src/components/finance-metrics/recurring/RecurringManager.tsx
import React, { useState, useEffect } from 'react';
import { useRecurringFinance, RecurringTransaction } from '../../../hooks/useRecurringFinance';
import RecurringForm from './RecurringForm';
import RecurringList from './RecurringList';

const RecurringManager: React.FC = () => {
  const {
    getAllRecurringTransactions,
    deleteRecurringTransaction,
    data: transactions,
    isLoading,
    error,
  } = useRecurringFinance();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    await getAllRecurringTransactions();
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação recorrente?')) {
      await deleteRecurringTransaction(id);
      await loadTransactions();
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
    loadTransactions();
  };

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
              Erro ao carregar transações recorrentes
            </h3>
            <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
            Transações Recorrentes
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Gerencie suas transações que se repetem periodicamente
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="
            w-full sm:w-auto
            px-4 py-3 sm:py-2.5
            bg-sky-500 text-white rounded-lg
            hover:bg-sky-600 transition-colors
            shadow-sm flex items-center justify-center gap-2
          "
        >
          <i className="fas fa-plus"></i>
          Nova Transação
        </button>
      </div>

      {/* List */}
      <RecurringList
        transactions={transactions || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal / Drawer */}
      {isFormOpen && (
        <RecurringForm
          transaction={editingTransaction}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default RecurringManager;
