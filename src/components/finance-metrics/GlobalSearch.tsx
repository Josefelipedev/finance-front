// src/components/finance-metrics/GlobalSearch.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { useGoals } from '../../hooks/useGoals';
import { useShopping } from '../../hooks/useShopping';
import type { FinanceRecord } from '../../types/finance';
import type { Goal } from '../../hooks/useGoals';
import type { ShoppingList } from '../../hooks/useShopping';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const contains = (haystack: string | null | undefined, needle: string) =>
  (haystack || '').toLowerCase().includes(needle.toLowerCase());

const GlobalSearch: React.FC = () => {
  const { getAllFinances } = useFinance();
  const { getAllGoals } = useGoals();
  const { getAllLists } = useShopping();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fontes carregadas uma vez e filtradas localmente (igual ao Android)
  const [transactions, setTransactions] = useState<FinanceRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const loadedRef = useRef(false);

  // Debounce da query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Carrega as fontes na primeira busca válida
  useEffect(() => {
    if (debounced.length < MIN_CHARS || loadedRef.current) return;
    loadedRef.current = true;
    setIsLoading(true);
    Promise.all([
      getAllFinances().catch(() => [] as FinanceRecord[]),
      getAllGoals().catch(() => [] as Goal[]),
      getAllLists().catch(() => [] as ShoppingList[]),
    ])
      .then(([txs, gs, ls]) => {
        setTransactions(txs || []);
        setGoals(gs || []);
        setLists(ls || []);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const results = useMemo(() => {
    if (debounced.length < MIN_CHARS) {
      return { txs: [], goals: [], lists: [] };
    }
    return {
      txs: transactions.filter((t) => contains(t.description, debounced)),
      goals: goals.filter((g) => contains(g.name, debounced)),
      lists: lists.filter((l) => contains(l.name, debounced)),
    };
  }, [debounced, transactions, goals, lists]);

  const total = results.txs.length + results.goals.length + results.lists.length;
  const hasQuery = debounced.length >= MIN_CHARS;

  return (
    <div className="space-y-5 px-2 sm:px-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Busca Global</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Pesquise em transações, metas e listas de compras
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Digite ao menos 2 caracteres..."
          className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {isLoading && (
          <i className="fas fa-spinner fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-brand-500"></i>
        )}
      </div>

      {!hasQuery ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <i className="fas fa-search text-4xl mb-3 opacity-40"></i>
          <p>Comece a digitar para buscar.</p>
        </div>
      ) : total === 0 && !isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <i className="fas fa-folder-open text-4xl mb-3 opacity-40"></i>
          <p>Nenhum resultado para "{debounced}".</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Transações */}
          {results.txs.length > 0 && (
            <Section title="Transações" icon="exchange-alt" count={results.txs.length}>
              {results.txs.map((tx) => (
                <ResultRow
                  key={`tx-${tx.id}`}
                  title={tx.description || 'Sem descrição'}
                  subtitle={tx.category?.name || 'Sem categoria'}
                  trailing={
                    <span
                      className={
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                  }
                  iconClass="fa-exchange-alt text-brand-500"
                />
              ))}
            </Section>
          )}

          {/* Metas */}
          {results.goals.length > 0 && (
            <Section title="Metas" icon="bullseye" count={results.goals.length}>
              {results.goals.map((g) => (
                <ResultRow
                  key={`goal-${g.id}`}
                  title={g.name}
                  subtitle={`${formatCurrency(g.currentValue)} de ${formatCurrency(g.targetValue)}`}
                  trailing={
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full">
                      {g.status === 'COMPLETED'
                        ? 'Concluída'
                        : g.status === 'CANCELED'
                          ? 'Cancelada'
                          : 'Ativa'}
                    </span>
                  }
                  iconClass="fa-bullseye text-amber-500"
                />
              ))}
            </Section>
          )}

          {/* Listas de compras */}
          {results.lists.length > 0 && (
            <Section title="Listas de compras" icon="shopping-cart" count={results.lists.length}>
              {results.lists.map((l) => (
                <ResultRow
                  key={`list-${l.id}`}
                  title={l.name}
                  subtitle={`${l.items?.length ?? 0} itens`}
                  iconClass="fa-shopping-cart text-emerald-500"
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{
  title: string;
  icon: string;
  count: number;
  children: React.ReactNode;
}> = ({ title, count, children }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
      {title} <span className="text-gray-400">({count})</span>
    </h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const ResultRow: React.FC<{
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  iconClass: string;
}> = ({ title, subtitle, trailing, iconClass }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
    <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0">
      <i className={`fas ${iconClass}`}></i>
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-medium text-gray-800 dark:text-white truncate">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
    </div>
    {trailing && <div className="shrink-0 font-semibold text-sm">{trailing}</div>}
  </div>
);

export default GlobalSearch;
