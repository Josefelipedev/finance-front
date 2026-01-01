// src/components/finance-metrics/shopping/PriceHistoryModal.tsx
import React, { useState, useEffect } from 'react';
import { useShopping } from '../../../hooks/useShopping';

interface PriceHistoryModalProps {
  itemId: number;
  onClose: () => void;
}

const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ itemId, onClose }) => {
  const {
    getPriceHistory,
    findLowestPrice,
    findHighestPrice,
    calculateAveragePrice,
    formatCurrency,
  } = useShopping();
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPriceHistory();
  }, [itemId]);

  const loadPriceHistory = async () => {
    setIsLoading(true);
    try {
      const history = await getPriceHistory(itemId);
      setPriceHistory(history);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriceChangeColor = (currentPrice: number, previousPrice: number) => {
    if (currentPrice < previousPrice) return 'text-green-600 dark:text-green-400';
    if (currentPrice > previousPrice) return 'text-red-600 dark:text-red-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  const getPriceChangeIcon = (currentPrice: number, previousPrice: number) => {
    if (currentPrice < previousPrice) return 'fas fa-arrow-down';
    if (currentPrice > previousPrice) return 'fas fa-arrow-up';
    return 'fas fa-minus';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Histórico de Preços
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          ) : priceHistory.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-chart-line text-4xl text-slate-300 dark:text-slate-600 mb-3"></i>
              <p className="text-slate-600 dark:text-slate-400">
                Nenhum histórico de preços encontrado
              </p>
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-green-600 dark:text-green-400">Menor Preço</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(findLowestPrice(priceHistory))}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">Maior Preço</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(findHighestPrice(priceHistory))}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Preço Médio</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(calculateAveragePrice(priceHistory))}
                  </p>
                </div>
              </div>

              {/* Lista de Histórico */}
              <div className="space-y-3">
                {priceHistory.map((history, index) => (
                  <div
                    key={history.id}
                    className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {formatCurrency(history.price)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(history.createdAt)}
                      </p>
                    </div>
                    {index > 0 && (
                      <div
                        className={`flex items-center gap-2 ${getPriceChangeColor(
                          history.price,
                          priceHistory[index - 1].price
                        )}`}
                      >
                        <i
                          className={getPriceChangeIcon(
                            history.price,
                            priceHistory[index - 1].price
                          )}
                        ></i>
                        <span className="text-sm">
                          {formatCurrency(Math.abs(history.price - priceHistory[index - 1].price))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryModal;
