import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import PageShell, { Surface } from '../../components/common/PageShell';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OwnerChip from '../../components/common/OwnerChip';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import { useConfirm } from '../../components/ui/confirm/useConfirm';
import CategorySelect from '../../components/form/CategorySelect';
import BankAccountSelect from '../../components/form/BankAccountSelect';
import AccountForecastCards from '../../components/finance-metrics/bills/AccountForecastCards';
import { useBills, BillItem, BillType, BillsForecast } from '../../hooks/useBills';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useBankAccounts } from '../../hooks/useBankAccounts';
import { ownerNaming } from '../../hooks/useOwner';
import { currencyOption, formatMoney } from '../../utils/currency';
import DateField from '../../components/form/DateField';

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
  /** Conta bancária de onde sai (ou onde entra); undefined = sem conta. */
  accountId?: number;
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
  const [accountId, setAccountId] = useState<number | undefined>(undefined);

  // Re-hidrata o formulário sempre que abre.
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initial) {
      setDescription(initial.description);
      setAmount(String(initial.amount));
      setDueDate(initial.dueDate.slice(0, 10));
      setType(initial.type);
      setCategoryId(initial.categoryId ?? undefined);
      setAccountId(initial.accountId ?? undefined);
    } else {
      setDescription('');
      setAmount('');
      setDueDate(defaultDueDate);
      setType(defaultType);
      setCategoryId(undefined);
      setAccountId(undefined);
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
    onSubmit({ description: desc, amount: amountValue, dueDate, type, categoryId, accountId });
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
            {[
              { value: 'expense' as BillType, label: 'A pagar', icon: 'fa-arrow-up' },
              { value: 'income' as BillType, label: 'A receber', icon: 'fa-arrow-down' },
            ].map((opt) => {
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
        <DateField id="bill-form-due" value={dueDate} onChange={setDueDate} />
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

      {/* Conta bancária: é ela que responde a "quanto me fica na conta". */}
      <div className="mt-4">
        <label htmlFor="bill-form-account" className={labelClass}>
          {type === 'income' ? 'Entra na conta' : 'Sai da conta'}{' '}
          <span className="font-normal text-gray-400">(opcional)</span>
        </label>
        <BankAccountSelect id="bill-form-account" value={accountId} onChange={setAccountId} />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="primary" size="sm" disabled={isSaving} onClick={submit}>
          {isSaving ? (
            <>
              <i className="fas fa-spinner fa-spin text-xs"></i>A guardar…
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
  // `?mes=AAAA-MM` abre o ecrã no mês pedido: é por aí que o crachá "Conta" das
  // Transações chega cá (B5). Sem isto o link caía sempre no mês corrente e a
  // conta que se queria ver podia nem estar na lista.
  const [searchParams] = useSearchParams();
  const [month, setMonth] = useState<string>(() => {
    const pedido = searchParams.get('mes');
    return pedido && /^\d{4}-\d{2}$/.test(pedido) ? pedido : currentMonth();
  });
  const [items, setItems] = useState<BillItem[]>([]);
  // Totais JÁ convertidos pelo servidor para a moeda de exibição do usuário.
  const [expense, setExpense] = useState({ pending: 0, paid: 0 });
  const [income, setIncome] = useState({ pending: 0, paid: 0 });
  const [projectedBalance, setProjectedBalance] = useState(0);
  const [realizedBalance, setRealizedBalance] = useState(0);
  // O que fica em cada conta bancária depois de pagar o que falta.
  const [accountsForecast, setAccountsForecast] = useState<BillsForecast | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState('BRL');
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Modal "valor pago/recebido" ao marcar uma conta pendente como paga.
  const [payingItem, setPayingItem] = useState<BillItem | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // Modal de criação / edição.
  // Filtros do ecrã. Vivem no cliente: a lista do mês já vem toda, e filtrar
  // no servidor obrigaria a ir buscá-la outra vez a cada clique.
  const [showCarriedOver, setShowCarriedOver] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine'>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<BillItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { getBills, createBill, updateBill, deleteBill, payBill, unpayBill } = useBills();
  const { profile, getProfile } = useUserProfile();
  const naming = useMemo(() => ownerNaming(profile), [profile]);
  const { confirm, dialog } = useConfirm();
  // As contas bancárias vêm daqui (e não da previsão) para o nome do banco
  // continuar a aparecer nas linhas de um mês fechado, onde não há previsão.
  const { accounts: bankAccounts, loadAccounts } = useBankAccounts();

  useEffect(() => {
    getProfile().catch(() => {});
    loadAccounts().catch(() => {});
  }, [getProfile, loadAccounts]);

  const hasAccounts = bankAccounts.length > 0;
  const accountName = useCallback(
    (id: number | null) =>
      id == null ? null : (bankAccounts.find((a) => a.id === id)?.bankName ?? null),
    [bankAccounts]
  );

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
        setAccountsForecast(res?.accounts ?? null);
        setDisplayCurrency(res?.displayCurrency ?? 'BRL');
      } catch (err) {
        setError((err as Error).message || 'Não foi possível carregar as contas.');
      } finally {
        setIsFetching(false);
      }
    },
    [getBills]
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
        item.type === 'income'
          ? 'Recebimento marcado como pendente.'
          : 'Conta marcada como pendente.'
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
      toast.success(
        item.type === 'income' ? 'Recebimento registrado!' : 'Conta marcada como paga!'
      );
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
          // `null` (e não `undefined`) para o servidor saber a diferença entre
          // "não mexeste nisto" e "tiraste a conta bancária".
          accountId: values.accountId ?? null,
        });
        toast.success('Conta atualizada.');
      } else {
        await createBill({
          description: values.description,
          amount: values.amount,
          dueDate: values.dueDate,
          type: values.type,
          categoryId: values.categoryId,
          accountId: values.accountId,
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
            isPaid ? 'Marcar como pendente' : isIncome ? 'Marcar como recebido' : 'Marcar como pago'
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
            {item.recurringId != null && (
              <Link
                to="/recorrentes"
                title="Gerada automaticamente a partir de uma transação recorrente — clique para gerir"
                className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-600 transition-colors hover:bg-brand-100 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-400 dark:hover:bg-brand-400/20"
              >
                <i className="fas fa-rotate text-[9px]"></i>
                Recorrente
              </Link>
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
            {/* Quem lançou — só aparece no workspace do casal */}
            <OwnerChip name={naming.ownerName(item.userId)} mine={naming.isMine(item.userId)} />
            {/* De que conta sai. Quando não está dito, a conta fica de fora da
                previsão por conta — e um número que falta explica-se melhor
                aqui, na linha que o causa, do que num aviso no topo. */}
            {accountName(item.accountId) ? (
              <span className="inline-flex items-center gap-1">
                <i className="fas fa-building-columns text-[10px] text-gray-400 dark:text-gray-500"></i>
                {accountName(item.accountId)}
              </span>
            ) : (
              !isPaid &&
              hasAccounts && (
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  title="Diga de que conta bancária sai para entrar na previsão por conta"
                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-1.5 py-0.5 text-[11px] text-gray-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-500"
                >
                  <i className="fas fa-building-columns text-[9px]"></i>
                  sem conta
                </button>
              )
            )}
          </div>
        </div>

        {/* Valor na moeda nativa */}
        <div className="shrink-0 text-right">
          {(() => {
            // Conta paga → mostra o valor efetivamente pago/recebido em destaque.
            // Se diferir do previsto, exibe o previsto em miúdo abaixo.
            const paidValue = isPaid && item.paidAmount != null ? item.paidAmount : item.amount;
            const showPrevisto =
              isPaid && item.paidAmount != null && item.paidAmount !== item.amount;
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

  const visibleItems = items.filter((i) => {
    if (!showCarriedOver && i.carriedOver) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && (i.categoryName ?? 'Sem categoria') !== categoryFilter)
      return false;
    if (ownerFilter === 'mine' && profile?.id != null && i.userId !== profile.id) return false;
    return true;
  });

  const categoriesInMonth = [...new Set(items.map((i) => i.categoryName ?? 'Sem categoria'))].sort(
    (a, b) => a.localeCompare(b, 'pt')
  );

  const carriedOverCount = items.filter((i) => i.carriedOver).length;
  const filtersActive =
    !showCarriedOver ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    ownerFilter !== 'all';

  const clearFilters = () => {
    setShowCarriedOver(true);
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setOwnerFilter('all');
  };

  /**
   * Subtotal do que está à vista.
   *
   * Só sai quando todas as linhas filtradas estão na mesma moeda — somar 100
   * BRL com 100 EUR e escrever 200 é o erro que os totais do servidor existem
   * para evitar, e aqui não há taxas de câmbio à mão.
   */
  const visibleCurrencies = [...new Set(visibleItems.map((i) => i.currency))];
  const visibleTotal =
    visibleCurrencies.length === 1
      ? visibleItems.reduce(
          (sum, i) => sum + (i.status === 'paid' ? (i.paidAmount ?? i.amount) : i.amount),
          0
        )
      : null;

  const expenseItems = sortOverdueFirst(visibleItems.filter((i) => i.type === 'expense'));
  const incomeItems = sortOverdueFirst(visibleItems.filter((i) => i.type === 'income'));

  const renderSection = (title: string, icon: string, list: BillItem[]) => {
    if (list.length === 0) return null;
    return (
      <div>
        <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <i className={`fas ${icon} text-xs text-gray-400 dark:text-gray-500`}></i>
          {title}
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
            ({list.length})
          </span>
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
          <Link
            to="/recorrentes"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            title="As recorrentes geram as contas deste mês automaticamente"
          >
            <i className="fas fa-rotate text-xs"></i>
            Recorrentes
          </Link>
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
          <p
            className={`mt-1 font-display text-xl font-semibold tabular-nums ${balanceClass(projectedBalance)}`}
          >
            {formatMoney(projectedBalance, displayCurrency)}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Saldo Realizado
          </p>
          <p
            className={`mt-1 font-display text-xl font-semibold tabular-nums ${balanceClass(realizedBalance)}`}
          >
            {formatMoney(realizedBalance, displayCurrency)}
          </p>
        </Surface>
      </div>

      {/* Os quatro números acima são do casal inteiro. Estes dizem em que conta
          é que o dinheiro fica — a pergunta de quem tem contas separadas. */}
      {!isFetching && !error && (
        <AccountForecastCards forecast={accountsForecast} currentUserId={profile?.id} />
      )}

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
        <div className="space-y-4">
          <Surface className="flex flex-wrap items-center gap-2 p-3">
            {carriedOverCount > 0 && (
              <button
                type="button"
                onClick={() => setShowCarriedOver((v) => !v)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  showCarriedOver
                    ? 'border-warning-500 bg-warning-50 text-warning-600 dark:bg-warning-500/10'
                    : 'border-gray-300 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                }`}
                title="Contas pendentes que vieram de meses anteriores"
              >
                <i className={`fas ${showCarriedOver ? 'fa-eye' : 'fa-eye-slash'} text-[10px]`}></i>
                Atrasadas de meses anteriores ({carriedOverCount})
              </button>
            )}

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              <option value="all">A pagar e a receber</option>
              <option value="expense">Só a pagar</option>
              <option value="income">Só a receber</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              <option value="all">Pendentes e pagas</option>
              <option value="pending">Só pendentes</option>
              <option value="paid">Só pagas</option>
            </select>

            {categoriesInMonth.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300"
              >
                <option value="all">Todas as categorias</option>
                {categoriesInMonth.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {profile?.id != null && new Set(items.map((i) => i.userId)).size > 1 && (
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value as typeof ownerFilter)}
                className="rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300"
              >
                <option value="all">Do casal</option>
                <option value="mine">Só minhas</option>
              </select>
            )}

            <span className="ml-auto flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {visibleItems.length} de {items.length}
                {visibleTotal != null && visibleItems.length > 0 && (
                  <> · {formatMoney(visibleTotal, visibleCurrencies[0])}</>
                )}
              </span>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-brand-600 hover:underline dark:text-brand-400"
                >
                  Limpar filtros
                </button>
              )}
            </span>
          </Surface>

          {visibleItems.length === 0 ? (
            <Surface className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma conta com estes filtros.
              </p>
              <div className="mt-4 flex justify-center">
                <Button size="sm" variant="outline" type="button" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </div>
            </Surface>
          ) : (
            <div className="space-y-6">
              {renderSection('A Pagar', 'fa-arrow-up', expenseItems)}
              {renderSection('A Receber', 'fa-arrow-down', incomeItems)}
            </div>
          )}
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
                        <i className="fas fa-spinner fa-spin text-xs"></i>A guardar…
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
