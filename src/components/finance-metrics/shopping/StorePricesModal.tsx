import React from 'react';
import { Modal } from '../../ui/modal';
import Button from '../../ui/button/Button';

interface StorePrice {
  supermarket: string;
  name: string;
  price: number;
  brand?: string;
}

interface StorePricesModalProps {
  itemName: string;
  prices: StorePrice[];
  isLoading: boolean;
  onClose: () => void;
}

const STORE_EMOJI: Record<string, string> = {
  continente: '🏪',
  auchan: '🟠',
  pingodoce: '🟡',
  mercadona: '🟢',
};

const StorePricesModal: React.FC<StorePricesModalProps> = ({ itemName, prices, isLoading, onClose }) => {
  const sorted = [...prices].sort((a, b) => a.price - b.price);

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-md">
      <div className="p-5">
        <div className="mb-4 pr-8">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Comparar Preços
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{itemName}</p>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum preço encontrado para este produto.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((p, idx) => (
                <div
                  key={`${p.supermarket}-${idx}`}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    idx === 0
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="text-sm">🏆</span>}
                    <span className="text-sm">
                      {STORE_EMOJI[p.supermarket] ?? '🏷️'}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${idx === 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
                        {p.supermarket.charAt(0).toUpperCase() + p.supermarket.slice(1)}
                      </p>
                      {p.brand && (
                        <p className="text-xs text-gray-400">{p.brand}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${idx === 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
                    €{p.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
        )}

        <Button variant="outline" onClick={onClose} className="mt-4 w-full">
          Fechar
        </Button>
      </div>
    </Modal>
  );
};

export default StorePricesModal;
