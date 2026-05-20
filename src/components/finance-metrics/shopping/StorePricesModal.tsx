import React from 'react';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                Comparar Preços
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{itemName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            >
              <i className="fas fa-times text-lg" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
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
                      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="text-sm">🏆</span>}
                    <span className="text-sm">
                      {STORE_EMOJI[p.supermarket] ?? '🏷️'}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${idx === 0 ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {p.supermarket.charAt(0).toUpperCase() + p.supermarket.slice(1)}
                      </p>
                      {p.brand && (
                        <p className="text-xs text-slate-400">{p.brand}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${idx === 0 ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    €{p.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-4 w-full py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorePricesModal;
