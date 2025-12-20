// src/components/finance-metrics/TransactionsList.tsx
import React, { useEffect } from 'react';
import { useFinance } from "../../hooks/useFinance.ts";

interface TransactionsListProps {
    dateRange: { start: string; end: string };
}

const TransactionsList: React.FC<TransactionsListProps> = ({ dateRange }) => {
    const { getAllFinances, isLoading, data } = useFinance();

    useEffect(() => {
        getAllFinances({
            startDate: dateRange.start,
            endDate: dateRange.end,
        });
    }, []);

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando transações...</p>
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
                    {dateRange.start || dateRange.end
                        ? 'Não há transações no período selecionado.'
                        : 'Comece adicionando sua primeira transação financeira.'}
                </p>
            </div>
        );
    }

    return (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray500 dark:text-gray-400 uppercase tracking-wider">
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
                                        <i className={`fas fa-${transaction.iconName || 'pricetag'} text-blue-600 dark:text-blue-400`}></i>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {transaction.description || 'Sem descrição'}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {transaction.category?.name || 'Sem categoria'}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.type === 'income'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                                {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                                Editar
                            </button>
                            <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                Excluir
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionsList;