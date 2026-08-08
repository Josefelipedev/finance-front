// src/components/finance-metrics/recurring/RecurringManager.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useRecurringFinance, RecurringTransaction } from '../../../hooks/useRecurringFinance';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { ownerNaming } from '../../../hooks/useOwner';
import RecurringForm from './RecurringForm';
import RecurringList from './RecurringList';
import RecurringSummary from './RecurringSummary';
import Button from '../../ui/button/Button';
import { useConfirm } from '../../ui/confirm/useConfirm';
import { formatMoney } from '../../../utils/currency';
import { remainingTotal } from '../../../utils/recurring';

const RecurringManager: React.FC = () => {
  const {
    getAllRecurringTransactions,
    deleteRecurringTransaction,
    settleRecurringTransaction,
    data: transactions,
    isLoading,
    error,
  } = useRecurringFinance();

  // O perfil serve a duas coisas nesta tela: a moeda em que os totais são
  // somados e os nomes do casal, para dizer quem lançou cada recorrente.
  const { profile, getProfile } = useUserProfile();
  const naming = useMemo(() => ownerNaming(profile), [profile]);

  const { confirm, dialog } = useConfirm();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [settlingIds, setSettlingIds] = useState<number[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  const loadTransactions = async () => {
    await getAllRecurringTransactions();
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  /**
   * "Paguei tudo": liquida de uma vez o que falta do parcelamento.
   *
   * A confirmação diz o valor e o que vai acontecer ao razão, porque isto
   * cria uma despesa de uma vez só — que pode ser a maior do mês — e fecha a
   * recorrente. Quem carrega no botão tem de saber os dois efeitos antes.
   */
  const handleSettleRequest = async (transaction: RecurringTransaction) => {
    const falta = remainingTotal(transaction) ?? 0;
    const recebe = transaction.type === 'income';
    const valor = formatMoney(falta, transaction.currency);
    const confirmed = await confirm({
      title: recebe ? 'Recebi tudo' : 'Paguei tudo',
      message: recebe
        ? `Liquidar os ${valor} que faltam receber de "${transaction.description}"? As parcelas por receber ficam recebidas e é criada uma receita de ${valor} com a data de hoje. A recorrente deixa de gerar novas contas.`
        : `Quitar os ${valor} que faltam de "${transaction.description}"? As parcelas por pagar ficam pagas e é criada uma despesa de ${valor} com a data de hoje. A recorrente deixa de gerar novas contas.`,
      confirmText: recebe ? 'Recebi tudo' : 'Paguei tudo',
    });
    if (!confirmed) return;

    setSettlingIds((prev) => [...prev, transaction.id]);
    try {
      const result = await settleRecurringTransaction(transaction.id);
      toast.success(
        recebe
          ? `Recebido: ${formatMoney(result.settledAmount, result.currency)} lançados hoje.`
          : `Quitado: ${formatMoney(result.settledAmount, result.currency)} lançados hoje.`
      );
      await loadTransactions();
    } catch (err) {
      // O HttpClient já traz a explicação do servidor na mensagem do Error
      // ("já está quitada", "não tem fim definido"): dizê-la é melhor do que um
      // "erro" genérico que não indica o que fazer a seguir.
      toast.error(
        (err as Error)?.message ||
          (recebe ? 'Erro ao liquidar a recorrente.' : 'Erro ao quitar a recorrente.')
      );
    } finally {
      setSettlingIds((prev) => prev.filter((id) => id !== transaction.id));
    }
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

      {/* Quanto isto tudo custa por mês e quanto falta pagar até ao fim */}
      <RecurringSummary
        transactions={transactions || []}
        displayCurrency={profile?.currency ?? 'BRL'}
      />

      {/* List */}
      <RecurringList
        transactions={transactions || []}
        naming={naming}
        onEdit={handleEdit}
        onSettle={handleSettleRequest}
        settlingIds={settlingIds}
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
