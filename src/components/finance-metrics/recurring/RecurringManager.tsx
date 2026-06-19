// src/components/finance-metrics/recurring/RecurringManager.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRecurringFinance, RecurringTransaction } from '../../../hooks/useRecurringFinance';
import { Modal } from '../../ui/modal';
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
  const [deletingTransaction, setDeletingTransaction] = useState<RecurringTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteRequest = (id: number) => {
    const transaction = transactions?.find((t) => t.id === id) ?? null;
    setDeletingTransaction(transaction);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    try {
      await deleteRecurringTransaction(deletingTransaction.id);
      toast.success('Transação recorrente excluída com sucesso!');
      setDeletingTransaction(null);
      await loadTransactions();
    } catch {
      toast.error('Erro ao excluir transação recorrente.');
    } finally {
      setIsDeleting(false);
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
        onDelete={handleDeleteRequest}
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

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={Boolean(deletingTransaction)}
        onClose={() => setDeletingTransaction(null)}
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            Confirmar Exclusão
          </h2>

          {deletingTransaction && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Tem certeza que deseja excluir a transação recorrente{' '}
                <strong>"{deletingTransaction.description}"</strong>? Esta ação não pode ser
                desfeita.
              </p>

              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
                <div className="flex items-center text-rose-600 dark:text-rose-400">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <span className="font-medium">Atenção!</span>
                </div>
                <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
                  A transação será removida e não gerará mais lançamentos automáticos.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setDeletingTransaction(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <i className="fas fa-spinner fa-spin"></i>
                      Excluindo...
                    </span>
                  ) : (
                    'Excluir'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RecurringManager;
