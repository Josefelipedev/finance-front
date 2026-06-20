// src/components/finance-metrics/TransactionsList.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useFinance, FinanceRecord } from '../../hooks/useFinance.ts';
import { Modal } from '../ui/modal';
import AddFinanceModal from './AddFinanceModal';
import { useAuth } from '../../context/AuthContext.tsx';

interface TransactionsListProps {
  dateRange: { startDate: string; endDate: string };
}

const TransactionsList: React.FC<TransactionsListProps> = ({ dateRange }) => {
  const { getAllFinances, deleteFinanceRecord, isLoading, error, records: data } = useFinance();
  const { user } = useAuth();
  const myUserId = user?.id;

  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<FinanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTransactions = () => {
    // O erro é capturado no estado `error` do hook; o catch evita unhandled rejection.
    getAllFinances({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }).catch(() => {});
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await deleteFinanceRecord(deletingRecord.id);
      toast.success('Transação excluída com sucesso!');
      setDeletingRecord(null);
      getAllFinances({ startDate: dateRange.startDate, endDate: dateRange.endDate });
    } catch {
      toast.error('Erro ao excluir transação.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando transações...</p>
      </div>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
          <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Erro ao carregar transações
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'Não foi possível carregar as transações.'}
        </p>
        <button
          onClick={loadTransactions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <i className="fas fa-exchange-alt text-gray-400 dark:text-gray-500 text-2xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Nenhuma transação encontrada
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {dateRange.startDate || dateRange.endDate
            ? 'Não há transações no período selecionado.'
            : 'Comece adicionando sua primeira transação financeira.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <i
                          className={`fas fa-${transaction.iconName || 'pricetag'} text-blue-600 dark:text-blue-400`}
                        ></i>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description || 'Sem descrição'}
                      </div>
                      {myUserId != null && transaction.userId != null &&
                        transaction.userId !== myUserId && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400">
                            <i className="fas fa-heart text-[9px]"></i>
                            Parceiro(a)
                          </span>
                        )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {transaction.category?.name || 'Sem categoria'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(
                    transaction.referenceDate || transaction.createdAt
                  ).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span
                    className={
                      transaction.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {transaction.amount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setEditingRecord(transaction)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingRecord(transaction)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      <AddFinanceModal
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        editRecord={editingRecord ?? undefined}
        onSuccess={() => {
          toast.success('Transação atualizada com sucesso!');
          setEditingRecord(null);
          getAllFinances({ startDate: dateRange.startDate, endDate: dateRange.endDate });
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Confirmar Exclusão
          </h2>

          {deletingRecord && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Tem certeza que deseja excluir a transação{' '}
                <strong>"{deletingRecord.description || 'sem descrição'}"</strong> de{' '}
                <strong>
                  {deletingRecord.amount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
                ? Esta ação não pode ser desfeita.
              </p>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <span className="font-medium">Atenção!</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  O registro será permanentemente removido.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setDeletingRecord(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
    </>
  );
};

export default TransactionsList;
