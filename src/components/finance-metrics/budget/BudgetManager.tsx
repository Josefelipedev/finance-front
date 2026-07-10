// src/components/finance-metrics/budget/BudgetManager.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useBudget, BudgetLimit } from '../../../hooks/useBudget';
import { useFinance } from '../../../hooks/useFinance';
import { useFinanceCategory, FinanceCategory } from '../../../hooks/useFinanceCategory';
import { Modal } from '../../ui/modal';
import CategorySelect from '../../form/CategorySelect';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { formatMoney, currencyOption } from '../../../utils/currency';
import Button from '../../ui/button/Button';

const monthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const BudgetManager: React.FC = () => {
  const { limits, upsert, remove } = useBudget();
  const { getAllFinances } = useFinance();
  const { getAllCategories } = useFinanceCategory();
  const { profile, getProfile } = useUserProfile();
  const displayCurrency = profile?.currency;
  const currencySymbol = currencyOption(displayCurrency).symbol;
  const formatCurrency = (value: number) => formatMoney(value, displayCurrency);

  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [spendByCategory, setSpendByCategory] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetLimit | null>(null);
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formLimit, setFormLimit] = useState<string>('');
  const [formAlertAt, setFormAlertAt] = useState<string>('80');

  const [deleting, setDeleting] = useState<BudgetLimit | null>(null);

  useEffect(() => {
    load();
    getProfile().catch(() => {});
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const [cats, txs] = await Promise.all([
        getAllCategories().catch(() => [] as FinanceCategory[]),
        getAllFinances(monthRange()).catch(() => []),
      ]);
      setCategories(cats || []);

      const spend: Record<number, number> = {};
      for (const tx of txs || []) {
        if (tx.type !== 'expense') continue;
        const catId = tx.categoryId ?? tx.category?.id;
        if (catId == null) continue;
        spend[catId] = (spend[catId] || 0) + (tx.amount || 0);
      }
      setSpendByCategory(spend);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormCategoryId('');
    setFormLimit('');
    setFormAlertAt('80');
    setIsFormOpen(true);
  };

  const openEdit = (limit: BudgetLimit) => {
    setEditing(limit);
    setFormCategoryId(limit.categoryId);
    setFormLimit(String(limit.monthlyLimit));
    setFormAlertAt(String(limit.alertAt));
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (formCategoryId === '') {
      toast.error('Selecione uma categoria.');
      return;
    }
    const limitValue = Number(formLimit);
    if (!limitValue || limitValue <= 0) {
      toast.error('Informe um limite mensal válido.');
      return;
    }
    const alertValue = Math.min(100, Math.max(1, Number(formAlertAt) || 80));
    const category = categories.find((c) => c.id === formCategoryId);

    upsert({
      categoryId: Number(formCategoryId),
      categoryName: category?.name ?? editing?.categoryName ?? 'Categoria',
      monthlyLimit: limitValue,
      alertAt: alertValue,
    });
    toast.success(editing ? 'Limite atualizado!' : 'Limite definido!');
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    remove(deleting.categoryId);
    toast.success('Limite removido.');
    setDeleting(null);
  };

  // Categorias ainda sem limite (para o select ao criar)
  const availableCategories = useMemo(() => {
    if (editing) return categories;
    const used = new Set(limits.map((l) => l.categoryId));
    return categories.filter((c) => !used.has(c.id));
  }, [categories, limits, editing]);

  const totalLimit = limits.reduce((acc, l) => acc + l.monthlyLimit, 0);
  const totalSpend = limits.reduce((acc, l) => acc + (spendByCategory[l.categoryId] || 0), 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
            Limites de Orçamento
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Defina um teto mensal de gastos por categoria e acompanhe o consumo
          </p>
        </div>

        <Button
          variant="primary"
          type="button"
          onClick={openCreate}
          startIcon={<i className="fas fa-plus"></i>}
          className="w-full sm:w-auto"
        >
          Novo Limite
        </Button>
      </div>

      {/* Resumo do mês */}
      {limits.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-wrap gap-4 justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gasto do mês</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {formatCurrency(totalSpend)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Limite total</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {formatCurrency(totalLimit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Disponível</p>
            <p
              className={`text-lg font-bold ${
                totalLimit - totalSpend < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatCurrency(totalLimit - totalSpend)}
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      {limits.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <i className="fas fa-wallet text-4xl mb-3 opacity-40"></i>
          <p>Nenhum limite definido. Crie o primeiro para acompanhar seus gastos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {limits.map((limit) => {
            const spent = spendByCategory[limit.categoryId] || 0;
            const pct = limit.monthlyLimit > 0 ? (spent / limit.monthlyLimit) * 100 : 0;
            const over = pct >= 100;
            const alerting = pct >= limit.alertAt;
            const barColor = over
              ? 'bg-rose-500'
              : alerting
                ? 'bg-amber-500'
                : 'bg-emerald-500';

            return (
              <div
                key={limit.categoryId}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                      {limit.categoryName}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatCurrency(spent)} de {formatCurrency(limit.monthlyLimit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {alerting && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full mr-1 ${
                          over
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        {over ? 'Estourou' : 'Atenção'}
                      </span>
                    )}
                    <button
                      onClick={() => openEdit(limit)}
                      className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
                      aria-label="Editar"
                    >
                      <i className="fas fa-pen text-sm"></i>
                    </button>
                    <button
                      onClick={() => setDeleting(limit)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      aria-label="Remover"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-slate-400">
                    <span>{pct.toFixed(0)}% usado</span>
                    <span>alerta em {limit.alertAt}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            {editing ? 'Editar Limite' : 'Novo Limite'}
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Categoria *
            </label>
            <CategorySelect
              value={typeof formCategoryId === 'number' ? formCategoryId : undefined}
              onChange={(id) => setFormCategoryId(id ?? '')}
              excludeIds={editing ? undefined : limits.map((l) => l.categoryId)}
              disabled={Boolean(editing)}
              placeholder="Selecione..."
            />
            {!editing && availableCategories.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Todas as categorias já têm limite definido.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Limite mensal ({currencySymbol}) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formLimit}
                onChange={(e) => setFormLimit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Alertar em (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formAlertAt}
                onChange={(e) => setFormAlertAt(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="80"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="button" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={Boolean(deleting)} onClose={() => setDeleting(null)} className="max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            Confirmar Exclusão
          </h2>
          {deleting && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Remover o limite de <strong>"{deleting.categoryName}"</strong>?
              </p>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setDeleting(null)}>
                  Cancelar
                </Button>
                <Button variant="danger" type="button" onClick={handleDelete}>
                  Remover
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BudgetManager;
