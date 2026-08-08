import React from 'react';
import { RecurringTransaction } from '../../../hooks/useRecurringFinance';
import { OwnerNaming } from '../../../hooks/useOwner';
import { formatMoney } from '../../../utils/currency';
import { canSettle, remainingTotal } from '../../../utils/recurring';
import OwnerChip from '../../common/OwnerChip';

interface RecurringListProps {
  transactions: RecurringTransaction[];
  /** Quem é quem no workspace do casal; no individual não desenha nada. */
  naming: OwnerNaming;
  onEdit: (transaction: RecurringTransaction) => void;
  /** "Paguei tudo": liquida de uma vez o que falta do parcelamento. */
  onSettle: (transaction: RecurringTransaction) => void;
  /** Ids a liquidar agora — o botão não pode ser carregado duas vezes. */
  settlingIds?: number[];
  onDelete: (id: number) => void;
}

const RecurringList: React.FC<RecurringListProps> = ({
  transactions,
  naming,
  onEdit,
  onSettle,
  settlingIds = [],
  onDelete,
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
        <i className="fas fa-redo text-4xl text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          Nenhuma transação recorrente encontrada
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4"
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
                      : 'fa-arrow-down text-error-600'
                  }`}
                />
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white leading-tight">
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

                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
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

                  {/* Quem lançou — só aparece no workspace do casal */}
                  <OwnerChip
                    name={naming.ownerName(transaction.userId)}
                    mine={naming.isMine(transaction.userId)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:gap-1 self-end sm:self-auto">
              {/* "Paguei tudo": o financiamento pago antes do tempo saía em UM
                  pagamento, e fechá-lo aqui poupa abrir as Contas mês a mês a
                  carregar em Pagar tantas vezes quantas as parcelas que faltam.
                  Só aparece onde há um fim contratado por liquidar. */}
              {canSettle(transaction) && (
                <button
                  onClick={() => onSettle(transaction)}
                  disabled={settlingIds.includes(transaction.id)}
                  className="p-2 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 disabled:opacity-50"
                  title={
                    transaction.type === 'income'
                      ? 'Recebi tudo — liquidar o que falta receber'
                      : 'Paguei tudo — quitar o que falta pagar'
                  }
                >
                  <i
                    className={`fas ${
                      settlingIds.includes(transaction.id)
                        ? 'fa-spinner fa-spin'
                        : 'fa-check-double'
                    }`}
                  />
                </button>
              )}
              <button
                onClick={() => onEdit(transaction)}
                className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                title="Editar"
              >
                <i className="fas fa-edit" />
              </button>
              <button
                onClick={() => onDelete(transaction.id)}
                className="p-2 rounded-lg text-error-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Excluir"
              >
                <i className="fas fa-trash" />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {transaction.occurrences ? 'Parcela' : 'Valor'}
              </p>
              <p
                className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-error-600'
                }`}
              >
                {formatMoney(transaction.amount, transaction.currency)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Categoria</p>
              <p className="font-medium text-gray-800 dark:text-white">
                {transaction.category?.name || 'Sem categoria'}
              </p>
            </div>

            <div>
              <p
                className="text-xs text-gray-500 dark:text-gray-400"
                title="Contas geradas por esta recorrente e marcadas como pagas"
              >
                Pagamentos
              </p>
              <p className="font-medium text-gray-800 dark:text-white">
                {transaction.executedCount}
                {transaction.occurrences && ` / ${transaction.occurrences}`}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total pago</p>
              <p className="font-medium text-gray-800 dark:text-white">
                {formatMoney(
                  transaction.paidTotal ?? transaction.amount * transaction.executedCount,
                  transaction.currency
                )}
              </p>
              {/* O contratado ao lado do pago: sem ele, "Total pago R$ 0,00"
                  não diz de quanto estamos a falar. Vem calculado do servidor
                  (as recorrentes antigas não têm total gravado). */}
              {transaction.contractedTotal != null && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  de {formatMoney(transaction.contractedTotal, transaction.currency)}
                </p>
              )}
            </div>

            {/* O que ainda falta desembolsar. Sem isto, quem quer saber quanto
                deve tinha de subtrair de cabeça o pago do contratado — e as
                assinaturas sem fim não têm resposta nenhuma a dar aqui. */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {transaction.type === 'income' ? 'Falta receber' : 'Falta pagar'}
              </p>
              {(() => {
                const falta = remainingTotal(transaction);
                if (falta == null) {
                  return (
                    <p
                      className="font-medium text-gray-500 dark:text-gray-400"
                      title="Sem número de parcelas nem total contratado: não há um fim para somar"
                    >
                      Sem fim definido
                    </p>
                  );
                }
                return (
                  <p
                    className={`font-semibold ${
                      falta > 0
                        ? 'text-gray-800 dark:text-white'
                        : 'text-success-600 dark:text-success-400'
                    }`}
                  >
                    {falta > 0
                      ? formatMoney(falta, transaction.currency)
                      : transaction.type === 'income'
                        ? 'Recebida'
                        : 'Quitada'}
                  </p>
                );
              })()}
            </div>
          </div>

          {transaction.endDate && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
