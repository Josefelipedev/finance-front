// src/components/finance-metrics/grocery/GrocerySearchManager.tsx
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useGrocerySearch,
  GROCERY_CHAINS,
  GroceryProduct,
} from '../../../hooks/useGrocerySearch';

const formatPrice = (value?: number, currency = 'EUR') => {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

const chainLabel = (source: string) =>
  GROCERY_CHAINS.find((c) => c.id === source.toLowerCase())?.label ?? source;

const GrocerySearchManager: React.FC = () => {
  const { data, isLoading, error, search } = useGrocerySearch();

  const [query, setQuery] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const toggleChain = (id: string) => {
    setSelectedChains((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) {
      toast.error('Digite o que deseja buscar.');
      return;
    }
    try {
      setStoreFilter('all');
      const res = await search({
        query: query.trim(),
        supermarkets: selectedChains.length ? selectedChains : undefined,
        postalCode: postalCode.trim() || undefined,
      });
      if (res.products.length === 0) {
        toast.info('Nenhum produto encontrado para essa busca.');
      }
    } catch {
      toast.error('Erro ao buscar preços.');
    }
  };

  const products = useMemo(() => data?.products ?? [], [data]);

  // Lojas presentes nos resultados, para o filtro secundário
  const storesInResults = useMemo(() => {
    const set = new Set(products.map((p) => p.source.toLowerCase()));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    if (storeFilter === 'all') return products;
    return products.filter((p) => p.source.toLowerCase() === storeFilter);
  }, [products, storeFilter]);

  // Menor preço para destacar a melhor oferta
  const bestPrice = useMemo(() => {
    const prices = filtered.map((p) => p.price).filter((v): v is number => v != null);
    return prices.length ? Math.min(...prices) : null;
  }, [filtered]);

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
          Buscar Preços
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Compare preços de produtos nos supermercados (Continente, Auchan, Mercadona e Pingo Doce)
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: frango, arroz, ovos..."
            className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Código postal (opcional)"
            className="w-full sm:w-48 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap"
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-search"></i>
            )}
            Buscar
          </button>
        </div>

        {/* Chain filters */}
        <div className="flex flex-wrap gap-2">
          {GROCERY_CHAINS.map((chain) => {
            const active = selectedChains.includes(chain.id);
            return (
              <button
                key={chain.id}
                type="button"
                onClick={() => toggleChain(chain.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-sky-400'
                }`}
              >
                <span className="mr-1">{chain.emoji}</span>
                {chain.label}
              </button>
            );
          })}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error.message}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 dark:text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500" />
          <p className="text-sm">Consultando Continente, Auchan, Mercadona e Pingo Doce...</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && data && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStoreFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                storeFilter === 'all'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}
            >
              Todos ({products.length})
            </button>
            {storesInResults.map((store) => (
              <button
                key={store}
                onClick={() => setStoreFilter(store)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                  storeFilter === store
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                }`}
              >
                {chainLabel(store)}
              </button>
            ))}
            {data.cached && (
              <span className="ml-auto text-xs text-slate-400">
                <i className="fas fa-bolt mr-1"></i>resultado em cache
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <i className="fas fa-search text-4xl mb-3 opacity-40"></i>
              <p>Nenhum produto encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filtered.map((product, idx) => (
                <ProductCard
                  key={`${product.source}-${idx}`}
                  product={product}
                  isBest={bestPrice != null && product.price === bestPrice}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProductCard: React.FC<{ product: GroceryProduct; isBest: boolean }> = ({
  product,
  isBest,
}) => (
  <a
    href={product.url}
    target="_blank"
    rel="noopener noreferrer"
    className={`block bg-white dark:bg-slate-800 border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${
      isBest ? 'border-emerald-400 dark:border-emerald-500' : 'border-slate-200 dark:border-slate-700'
    }`}
  >
    <div className="flex gap-3">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-16 h-16 object-contain rounded-lg bg-slate-50 dark:bg-slate-700 shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
          <i className="fas fa-shopping-basket text-slate-300 dark:text-slate-500"></i>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
            {chainLabel(product.source)}
          </span>
          {isBest && (
            <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">
              Melhor preço
            </span>
          )}
        </div>
        <h3 className="font-medium text-slate-800 dark:text-white text-sm mt-1.5 line-clamp-2">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{product.brand}</p>
        )}
      </div>
    </div>

    <div className="mt-3 flex items-end justify-between">
      <div>
        <p className="text-lg font-bold text-slate-800 dark:text-white">
          {formatPrice(product.price, product.currency)}
        </p>
        {product.unit_price != null && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatPrice(product.unit_price, product.currency)}
            {product.unit ? `/${product.unit}` : ''}
          </p>
        )}
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          product.availability?.toLowerCase().includes('disp') ||
          product.availability?.toLowerCase() === 'in_stock' ||
          product.availability?.toLowerCase() === 'available'
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
        }`}
      >
        {product.availability || '—'}
      </span>
    </div>
  </a>
);

export default GrocerySearchManager;
