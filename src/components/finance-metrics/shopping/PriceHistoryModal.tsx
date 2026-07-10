import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useShopping, PriceHistory } from '../../../hooks/useShopping';
import { Modal } from '../../ui/modal';

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
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPriceHistory();
  }, [itemId]);

  const loadPriceHistory = async () => {
    setIsLoading(true);
    try {
      const history = await getPriceHistory(itemId);
      setPriceHistory(history);
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao carregar histórico de preços.');
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
    if (currentPrice > previousPrice) return 'text-error-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getPriceChangeIcon = (currentPrice: number, previousPrice: number) => {
    if (currentPrice < previousPrice) return 'fas fa-arrow-down';
    if (currentPrice > previousPrice) return 'fas fa-arrow-up';
    return 'fas fa-minus';
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="mb-6 pr-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Histórico de Preços
          </h3>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : priceHistory.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-chart-line text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
              <p className="text-gray-600 dark:text-gray-400">
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
                  <p className="text-sm text-error-600 dark:text-red-400">Maior Preço</p>
                  <p className="text-xl font-bold text-error-600 dark:text-red-400">
                    {formatCurrency(findHighestPrice(priceHistory))}
                  </p>
                </div>
                <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4">
                  <p className="text-sm text-brand-600 dark:text-brand-400">Preço Médio</p>
                  <p className="text-xl font-bold text-brand-600 dark:text-brand-400">
                    {formatCurrency(calculateAveragePrice(priceHistory))}
                  </p>
                </div>
              </div>

              {/* Lista de Histórico */}
              <div className="space-y-3">
                {priceHistory.map((history, index) => (
                  <div
                    key={history.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {formatCurrency(history.price)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
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
    </Modal>
  );
};

export default PriceHistoryModal;
