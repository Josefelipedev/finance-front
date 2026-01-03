import React from 'react';

interface Transaction {
  id: string;
  title: string;
  date: string;
  time: string;
  tag: string;
  amount: number;
}

interface FinanceTableProps {
  transactions: Transaction[];
}

const FinanceTable: React.FC<FinanceTableProps> = ({ transactions }) => {
  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'income':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTagText = (tag: string) => {
    switch (tag) {
      case 'income':
        return 'Receita';
      case 'expense':
        return 'Despesa';
      default:
        return tag;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Transações Recentes
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {transaction.title}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {transaction.date} {transaction.time}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTagColor(
                      transaction.tag
                    )}`}
                  >
                    {getTagText(transaction.tag)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div
                    className={`text-sm font-medium ${
                      transaction.tag === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.tag === 'income' ? '+' : '-'} R${' '}
                    {Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceTable;
