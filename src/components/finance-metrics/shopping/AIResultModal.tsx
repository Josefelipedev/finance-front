import React from 'react';
import { AiGenerateResult } from '../../../hooks/useShopping';
import { Modal } from '../../ui/modal';

interface AIResultModalProps {
  result: AiGenerateResult;
  onClose: () => void;
}

const AIResultModal: React.FC<AIResultModalProps> = ({ result, onClose }) => {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">

      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-sky-500 rounded-t-3xl">
        <div className="flex items-center gap-3 pr-8">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <i className="fas fa-robot text-white text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Lista Gerada com Sucesso!</h3>
            <p className="text-sm text-white/80">{result.list.name}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Estimativa Total</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                {formatCurrency(result.totalEstimate)}
              </p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 text-center">
              <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">Itens Criados</p>
              <p className="text-2xl font-bold text-brand-700 dark:text-brand-300 mt-1">
                {result.list.items.length}
              </p>
            </div>
          </div>

          {/* Savings Summary */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex gap-3">
              <i className="fas fa-piggy-bank text-amber-500 text-xl mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                  Potencial de economia
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">{result.savingsSummary}</p>
              </div>
            </div>
          </div>

          {/* Items list */}
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <i className="fas fa-list text-brand-500" />
              Itens da lista
            </h4>
            <div className="space-y-2">
              {result.list.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 dark:text-white text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 ml-4 shrink-0">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {result.tips && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex gap-3">
                <i className="fas fa-lightbulb text-purple-500 text-lg mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    Dica da IA
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">{result.tips}</p>
                </div>
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-sky-500 text-white rounded-lg hover:from-purple-600 hover:to-sky-600 transition-all shadow-sm font-medium"
            >
              <i className="fas fa-check mr-2" />
              Ver na lista de compras
            </button>
          </div>
        </div>
    </Modal>
  );
};

export default AIResultModal;
