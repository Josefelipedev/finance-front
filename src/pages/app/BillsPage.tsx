import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import PageShell, { Surface } from '../../components/common/PageShell';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import { useConfirm } from '../../components/ui/confirm/useConfirm';
import CategorySelect from '../../components/form/CategorySelect';
import { useBills, BillItem, BillType } from '../../hooks/useBills';
import { useUserProfile } from '../../hooks/useUserProfile';
import { currencyOption, formatMoney } from '../../utils/currency';

// ===== Helpers de mês / data =====

/** Mês atual como "YYYY-MM". */
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Desloca um "YYYY-MM" em `delta` meses. */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "julho de 2026" (pt-BR). */
function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

/** "dd/MM" (pt-BR) a partir de uma ISO date. */
function formatDueDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

/** Primeiro dia do mês como "YYYY-MM-DD" (default de vencimento no formulário). */
function firstDayOf(month: string): string {
  return `${month}-01`;
}

// ===== Formulário de nova conta / edição (local) =====

interface BillFormSubmit {
  description: string;
  amount: number;
  dueDate: string; // "YYYY-MM-DD"
  type: BillType;
  categoryId?: number;
}

interface BillFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initial: BillItem | null;
  defaultType: BillType;
  defaultDueDate: string; // "YYYY-MM-DD" para pré-preencher na criação
  currencySymbol: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: BillFormSubmit) => void;
}

function BillFormModal({
  isOpen,
  mode,
  initial,
  defaultType,
  defaultDueDate,
  currencySymbol,
  isSaving,
  onClose,
  onSubmit,
}: BillFormModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<BillType>('expense');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  // Re-hidrata o formulário sempre que abre.
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initial) {
      setDescription(initial.description);
      setAmount(String(initial.amount));
      setDueDate(initial.dueDate.slice(0, 10));
      setType(initial.type);
      setCategoryId(initial.categoryId ?? undefined);
    } else {
      setDescription('');
      setAmount('');
      setDueDate(defaultDueDate);
      setType(defaultType);
      setCategoryId(undefined);
    }
  }, [isOpen, mode, initial, defaultType, defaultDueDate]);

  const submit = () => {
    const desc = description.trim();
    if (!desc) {
      toast.error('Informe uma descrição.');
      return;
    }
    const amountValue = Number.parseFloat(amount.replace(',', '.'));
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    if (!dueDate) {
      toast.error('Informe o vencimento.');
      return;
    }
    onSubmit({ description: desc, amount: amountValue, dueDate, type, categoryId });
  };

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400';
  const labelClass = 'mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      className="max-w-md p-6 sm:p-7"
    >
      <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
        {mode === 'edit' ? 'Editar conta' : 'Nova conta'}
      </h3>

      {/* Tipo (apenas na criação — o tipo é imutável ao editar) */}
      {mode === 'create' && (
        <div className="mt-5">
          <span className={labelClass}>Tipo</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: 'expense' as BillType, label: 'A pagar', icon: 'fa-arrow-up' },
                { value: 'income' as BillType, label: 'A receber', icon: 'fa-arrow-down' },
              ]
            ).map((opt) => {
              const active = type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors ${
                    active
                      ? opt.value === 'income'
                        ? 'border-success-500 bg-success-50 text-success-700 dark:border-success-500/50 dark:bg-success-500/10 dark:text-success-400'
                        : 'border-error-400 bg-error-50 text-error-700 dark:border-error-500/50 dark:bg-error-500/10 dark:text-error-400'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <i className={`fas ${opt.icon} text-xs`}></i>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Descrição */}
      <div className="mt-5">
        <label htmlFor="bill-form-desc" className={labelClass}>
          Descrição
        </label>
        <input
          id="bill-form-desc"
          type="text"
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Aluguel, Salário…"
          className={inputClass}
        />
      </div>

      {/* Valor */}
      <div className="mt-4">
        <label htmlFor="bill-form-amount" className={labelClass}>
          Valor
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-gray-400 dark:text-gray-500">
            {currencySymbol}
          </span>
          <input
            id="bill-form-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} pl-12 tabular-nums`}
          />
        </div>
      </div>

      {/* Vencimento */}
      <div className="mt-4">
        <label htmlFor="bill-form-due" className={labelClass}>
          Vencimento
        </label>
        <input
          id="bill-form-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={`${inputClass} tabular-nums`}
        />
      </div>

      {/* Categoria (opcional) */}
      <div className="mt-4">
        <label htmlFor="bill-form-category" className={labelClass}>
          Categoria <span className="font-normal text-gray-400">(opcional)</span>
        </label>
        <CategorySelect
          id="bill-form-category"
          value={categoryId}
          onChange={setCategoryId}
          type={type}
          placeholder="Sem categoria"
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="primary" size="sm" disabled={isSaving} onClick={submit}>
          {isSaving ? (
            <>
              <i className="fas fa-spinner fa-spin text-xs"></i>
              A guardar…
            </>
          ) : mode === 'edit' ? (
            'Guardar alterações'
          ) : (
            'Criar conta'
          )}
        </Button>
      </div>
    </Modal>
  );
}

// ===== Página =====

export default function BillsPage() {
  const [month, setMonth] = useState<string>(currentMonth());
  const [items, setItems] = useState<BillItem[]>([]);
  // Totais JÁ convertidos pelo servidor para a moeda de exibição do usuário.
  const [expense, setExpense] = useState({ pending: 0, paid: 0 });
  const [income, setIncome] = useState({ pending: 0, paid: 0 });
  const [projectedBalance, setProjectedBalance] = useState(0);
  const [realizedBalance, setRealizedBalance] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState('BRL');
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Modal "valor pago/recebido" ao marcar uma conta pendente como paga.
  const [payingItem, setPayingItem] = useState<BillItem | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // Modal de criação / edição.
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<BillItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { getBills, createBill, updateBill, deleteBill, payBill, unpayBill } = useBills();
  const { profile, getProfile } = useUserProfile();
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  const load = useCallback(
    async (targetMonth: string) => {
      setIsFetching(true);
      setError(null);
      try {
        const res = await getBills(targetMonth);
        setItems(res?.items ?? []);
        setExpense(res?.expense ?? { pending: res?.totalPending ?? 0, paid: res?.totalPaid ?? 0 });
        setIncome(res?.income ?? { pending: 0, paid: 0 });
        setProjectedBalance(res?.projectedBalance ?? 0);
        setRealizedBalance(res?.realizedBalance ?? 0);
        setDisplayCurrency(res?.displayCurrency ?? 'BRL');
      } catch (err) {
        setError((err as Error).message || 'Não foi possível carregar as contas.');
      } finally {
        setIsFetching(false);
      }
    },
    [getBills],
  );

  useEffect(() => {
    load(month);
  }, [load, month]);

  // Clicar no checkbox: pago → despaga direto; pendente → abre o modal de valor.
  const handleToggle = (item: BillItem) => {
    if (togglingId != null) return;
    if (item.status === 'paid') {
      void unpay(item);
    } else {
      setPayingItem(item);
      // Pré-preenche com o previsto, na moeda nativa da conta.
      setPayAmount(String(item.amount));
    }
  };

  const unpay = async (item: BillItem) => {
    setTogglingId(item.id);
    try {
      await unpayBill(item.id);
      toast.success(
        item.type === 'income' ? 'Recebimento marcado como pendente.' : 'Conta marcada como pendente.',
      );
      await load(month);
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível atualizar a conta.');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmPay = async () => {
    if (!payingItem) return;
    const amountValue = Number.parseFloat(payAmount.replace(',', '.'));
    if (!Number.isFinite(amountValue) || amountValue < 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    const item = payingItem;
    setTogglingId(item.id);
    try {
      await payBill(item.id, amountValue);
      toast.success(item.type === 'income' ? 'Recebimento registrado!' : 'Conta marcada como paga!');
      setPayingItem(null);
      await load(month);
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível atualizar a conta.');
    } finally {
      setTogglingId(null);
    }
  };

  // ===== Criar / editar =====

  const openCreate = () => {
    setFormMode('create');
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: BillItem) => {
    setFormMode('edit');
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values: BillFormSubmit) => {
    setIsSaving(true);
    try {
      if (formMode === 'edit' && editingItem) {
        await updateBill(editingItem.id, {
          description: values.description,
          amount: values.amount,
          dueDate: values.dueDate,
          categoryId: values.categoryId,
        });
        toast.success('Conta atualizada.');
      } else {
        await createBill({
          description: values.description,
          amount: values.amount,
          dueDate: values.dueDate,
          type: values.type,
          categoryId: values.categoryId,
          currency: profile?.currency,
        });
        toast.success(values.type === 'income' ? 'Recebimento criado!' : 'Conta criada!');
      }
      setFormOpen(false);
      setEditingItem(null);
      await load(month);
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível guardar a conta.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: BillItem) => {
    const ok = await confirm({
      title: item.type === 'income' ? 'Excluir recebimento' : 'Excluir conta',
      message: `Remover "${item.description}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    setTogglingId(item.id);
    try {
      await deleteBill(item.id);
      toast.success('Conta removida.');
      await load(month);
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível remover a conta.');
    } finally {
      setTogglingId(null);
    }
  };

  // ===== Render de uma linha =====

  const renderRow = (item: BillItem) => {
    const isIncome = item.type === 'income';
    const isPaid = item.status === 'paid';
    const isOverdue = item.overdue;
    const isToggling = togglingId === item.id;
    return (
      <div
        key={item.id}
        className={`flex items-center gap-3 p-4 sm:gap-4 sm:p-5 ${
          isOverdue ? 'bg-error-50/40 dark:bg-error-500/[0.06]' : ''
        }`}
      >
        {/* Toggle "Pago"/"Recebido" */}
        <button
          type="button"
          onClick={() => handleToggle(item)}
          disabled={isToggling}
          aria-label={
            isPaid
              ? 'Marcar como pendente'
              : isIncome
                ? 'Marcar como recebido'
                : 'Marcar como pago'
          }
          aria-pressed={isPaid}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isPaid
              ? 'border-success-500 bg-success-500 text-white'
              : isOverdue
                ? 'border-error-400 text-transparent hover:border-error-500 dark:border-error-500/60'
                : 'border-gray-300 text-transparent hover:border-brand-400 dark:border-white/20'
          }`}
        >
          {isToggling ? (
            <i className="fas fa-spinner fa-spin text-[11px] text-gray-400"></i>
          ) : (
            <i className="fas fa-check text-[11px]"></i>
          )}
        </button>

        {/* Descrição + metadados */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`truncate font-medium ${
                isPaid
                  ? 'text-gray-400 line-through dark:text-gray-500'
                  : isOverdue
                    ? 'text-error-600 dark:text-error-400'
                    : 'text-gray-900 dark:text-white'
              }`}
            >
              {item.description}
            </p>
            {isOverdue && (
              <span className="inline-flex items-center rounded-md border border-error-200 bg-error-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                Em atraso
              </span>
            )}
            {item.carriedOver && (
              <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-400">
                Mês anterior
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <i className="fas fa-calendar-day text-[10px] text-gray-400 dark:text-gray-500"></i>
              {formatDueDate(item.dueDate)}
            </span>
            {item.categoryName && (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.categoryColor ?? '#9ca3af' }}
                ></span>
                {item.categoryName}
              </span>
            )}
          </div>
        </div>

        {/* Valor na moeda nativa */}
        <div className="shrink-0 text-right">
          {(() => {
            // Conta paga → mostra o valor efetivamente pago/recebido em destaque.
            // Se diferir do previsto, exibe o previsto em miúdo abaixo.
            const paidValue = isPaid && item.paidAmount != null ? item.paidAmount : item.amount;
            const showPrevisto = isPaid && item.paidAmount != null && item.paidAmount !== item.amount;
            return (
              <>
                <p
                  className={`font-display font-semibold tabular-nums ${
                    !isPaid && isOverdue
                      ? 'text-error-600 dark:text-error-400'
                      : isIncome && !isPaid
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {formatMoney(paidValue, item.currency)}
                </p>
                {showPrevisto && (
                  <p className="mt-0.5 text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                    previsto {formatMoney(item.amount, item.currency)}
                  </p>
                )}
              </>
            );
          })()}
          {isPaid && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-success-600 dark:text-success-400">
              <i className="fas fa-check text-[10px]"></i>
              {isIncome ? 'Recebido' : 'Pago'}
            </span>
          )}
        </div>

        {/* Ações: editar (só pendente) + excluir */}
        <div className="flex shrink-0 items-center gap-1">
          {!isPaid && (
            <button
              type="button"
              onClick={() => openEdit(item)}
              disabled={isToggling}
              aria-label="Editar conta"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              <i className="fas fa-pen text-xs"></i>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDelete(item)}
            disabled={isToggling}
            aria-label="Excluir conta"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10 dark:hover:text-error-400"
          >
            <i className="fas fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>
    );
  };

  // Ordena atrasadas no topo (sort estável mantém a ordem original no resto).
  const sortOverdueFirst = (list: BillItem[]) =>
    [...list].sort((a, b) => Number(b.overdue) - Number(a.overdue));

  const expenseItems = sortOverdueFirst(items.filter((i) => i.type === 'expense'));
  const incomeItems = sortOverdueFirst(items.filter((i) => i.type === 'income'));

  const renderSection = (title: string, icon: string, list: BillItem[]) => {
    if (list.length === 0) return null;
    return (
      <div>
        <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <i className={`fas ${icon} text-xs text-gray-400 dark:text-gray-500`}></i>
          {title}
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({list.length})</span>
        </h2>
        <Surface className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {list.map(renderRow)}
        </Surface>
      </div>
    );
  };

  const balanceClass = (v: number) =>
    v < 0 ? 'text-error-500 dark:text-error-400' : 'text-success-600 dark:text-success-400';

  return (
    <PageShell
      title="Contas do mês"
      description="Acompanhe o que vence, o que entra e o saldo previsto × realizado."
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="primary" size="sm" onClick={openCreate}>
            <i className="fas fa-plus text-xs"></i>
            Nova conta
          </Button>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-white/[0.08] dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              aria-label="Mês anterior"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              <i className="fas fa-chevron-left text-sm"></i>
            </button>
            <span className="min-w-[9rem] text-center text-sm font-semibold capitalize text-gray-900 dark:text-white">
              {formatMonthLabel(month)}
            </span>
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              aria-label="Próximo mês"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              <i className="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
        </div>
      }
    >
      {/* Resumo do mês: A Pagar / A Receber / Saldo Previsto / Saldo Realizado */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Surface className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            A Pagar
          </p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-error-500 dark:text-error-400">
            {formatMoney(expense.pending, displayCurrency)}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            A Receber
          </p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-success-600 dark:text-success-400">
            {formatMoney(income.pending, displayCurrency)}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Saldo Previsto
          </p>
          <p className={`mt-1 font-display text-xl font-semibold tabular-nums ${balanceClass(projectedBalance)}`}>
            {formatMoney(projectedBalance, displayCurrency)}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Saldo Realizado
          </p>
          <p className={`mt-1 font-display text-xl font-semibold tabular-nums ${balanceClass(realizedBalance)}`}>
            {formatMoney(realizedBalance, displayCurrency)}
          </p>
        </Surface>
      </div>

      {/* Lista de contas */}
      {isFetching ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" color="brand" message="A carregar contas…" />
        </div>
      ) : error ? (
        <Surface className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-error-50 text-xl text-error-500 dark:bg-error-500/10 dark:text-error-400">
            <i className="fas fa-triangle-exclamation"></i>
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-gray-900 dark:text-white">
            Algo correu mal
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <div className="mt-5 flex justify-center">
            <Button size="sm" variant="primary" type="button" onClick={() => load(month)}>
              <i className="fas fa-rotate-right text-xs"></i>
              Tentar de novo
            </Button>
          </div>
        </Surface>
      ) : items.length === 0 ? (
        <Surface className="p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-xl text-brand-600 dark:bg-brand-400/10 dark:text-brand-400">
            <i className="fas fa-file-invoice-dollar"></i>
          </span>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Nenhuma conta neste mês.</p>
          <div className="mt-5 flex justify-center">
            <Button size="sm" variant="primary" type="button" onClick={openCreate}>
              <i className="fas fa-plus text-xs"></i>
              Nova conta
            </Button>
          </div>
        </Surface>
      ) : (
        <div className="space-y-6">
          {renderSection('A Pagar', 'fa-arrow-up', expenseItems)}
          {renderSection('A Receber', 'fa-arrow-down', incomeItems)}
        </div>
      )}

      {/* Modal: valor efetivamente pago/recebido ao marcar uma conta pendente como paga */}
      <Modal
        isOpen={payingItem != null}
        onClose={() => {
          if (togglingId == null) setPayingItem(null);
        }}
        className="max-w-md p-6 sm:p-7"
      >
        {payingItem &&
          (() => {
            const isIncome = payingItem.type === 'income';
            return (
              <>
                <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                  {isIncome ? 'Registrar recebimento' : 'Marcar como paga'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isIncome ? 'Quanto foi recebido em ' : 'Quanto foi pago em '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {payingItem.description}
                  </span>
                  ?
                </p>
                <div className="mt-5">
                  <label
                    htmlFor="bill-pay-amount"
                    className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {isIncome ? 'Valor recebido' : 'Valor pago'}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-gray-400 dark:text-gray-500">
                      {currencyOption(payingItem.currency).symbol}
                    </span>
                    <input
                      id="bill-pay-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      autoFocus
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void confirmPay();
                        }
                      }}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-3.5 text-sm tabular-nums text-gray-900 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    Previsto: {formatMoney(payingItem.amount, payingItem.currency)}
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={togglingId != null}
                    onClick={() => setPayingItem(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={togglingId != null}
                    onClick={() => void confirmPay()}
                  >
                    {togglingId != null ? (
                      <>
                        <i className="fas fa-spinner fa-spin text-xs"></i>
                        A guardar…
                      </>
                    ) : isIncome ? (
                      'Confirmar recebimento'
                    ) : (
                      'Confirmar pagamento'
                    )}
                  </Button>
                </div>
              </>
            );
          })()}
      </Modal>

      {/* Modal: criar / editar conta */}
      <BillFormModal
        isOpen={formOpen}
        mode={formMode}
        initial={editingItem}
        defaultType="expense"
        defaultDueDate={firstDayOf(month)}
        currencySymbol={currencyOption(editingItem?.currency ?? profile?.currency).symbol}
        isSaving={isSaving}
        onClose={() => {
          if (!isSaving) {
            setFormOpen(false);
            setEditingItem(null);
          }
        }}
        onSubmit={handleFormSubmit}
      />

      {dialog}
    </PageShell>
  );
}
