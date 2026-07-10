// src/components/finance-metrics/recurring/RecurringManager.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRecurringFinance, RecurringTransaction } from '../../../hooks/useRecurringFinance';
import RecurringForm from './RecurringForm';
import RecurringList from './RecurringList';
import Button from '../../ui/button/Button';
import { useConfirm } from '../../ui/confirm/useConfirm';

const RecurringManager: React.FC = () => {
  const {
    getAllRecurringTransactions,
    deleteRecurringTransaction,
    data: transactions,
    isLoading,
    error,
  } = useRecurringFinance();

  const { confirm, dialog } = useConfirm();
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

  const handleDeleteRequest = async (id: number) => {
    const transaction = transactions?.find((t) => t.id === id) ?? null;
    const confirmed = await confirm({
      title: 'Excluir transação recorrente',
      message: transaction
        ? `Excluir a recorrente "${transaction.description}"? Ela deixará de gerar lançamentos automáticos. Esta ação não pode ser desfeita.`
        : 'Excluir esta transação recorrente? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await deleteRecurringTransaction(id);
      toast.success('Transação recorrente excluída com sucesso!');
      await loadTransactions();
    } catch {
      toast.error('Erro ao excluir transação recorrente.');
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
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6">
        <div className="flex gap-3">
          <i className="fas fa-exclamation-circle text-error-500 text-xl mt-0.5"></i>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">
              Erro ao carregar transações recorrentes
            </h3>
            <p className="text-error-600 dark:text-red-400 text-xs sm:text-sm mt-1">
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Transações Recorrentes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Gerencie suas transações que se repetem periodicamente
          </p>
        </div>

        <Button
          variant="primary"
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="w-full sm:w-auto"
          startIcon={<i className="fas fa-plus"></i>}
        >
          Nova Transação
        </Button>
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

      {dialog}
    </div>
  );
};

export default RecurringManager;
