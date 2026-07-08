import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import PageShell, { Surface } from '../../components/common/PageShell';
import { useBankAccounts } from '../../hooks/useBankAccounts';
import { useAuth } from '../../context/AuthContext';
import { CURRENCY_OPTIONS, currencyOption, formatMoney } from '../../utils/currency';

export default function AccountsPage() {
  const { accounts, isLoading, loadAccounts, createAccount, archiveAccount } = useBankAccounts();
  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<number | null>(null);
  const [form, setForm] = useState({
    bankName: '',
    accountNumber: '',
    currency: user?.currency || 'BRL',
    balance: '',
  });

  useEffect(() => {
    loadAccounts().catch(() => {});
  }, [loadAccounts]);

  useEffect(() => {
    if (user?.currency && !showForm) {
      setForm((prev) => ({ ...prev, currency: user.currency! }));
    }
  }, [user?.currency, showForm]);

  // Expira a confirmação de arquivamento
  useEffect(() => {
    if (confirmArchive === null) return;
    const timer = setTimeout(() => setConfirmArchive(null), 5000);
    return () => clearTimeout(timer);
  }, [confirmArchive]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bankName.trim()) {
      toast.error('Informe o nome do banco.');
      return;
    }
    setIsSaving(true);
    try {
      await createAccount({
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim() || undefined,
        currency: form.currency,
        balance: form.balance ? parseFloat(form.balance.replace(',', '.')) || 0 : 0,
      });
      toast.success('Conta criada!');
      setForm({ bankName: '', accountNumber: '', currency: user?.currency || 'BRL', balance: '' });
      setShowForm(false);
      await loadAccounts();
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível criar a conta.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (confirmArchive !== id) {
      setConfirmArchive(id);
      return;
    }
    try {
      await archiveAccount(id);
      toast.success('Conta arquivada.');
      setConfirmArchive(null);
      await loadAccounts();
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível arquivar.');
    }
  };

  return (
    <PageShell
      title="Contas"
      description="As contas do casal, cada uma na sua moeda"
      actions={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-950 shadow-glow transition-colors hover:bg-brand-300"
        >
          <i className={`fas ${showForm ? 'fa-xmark' : 'fa-plus'} text-xs`}></i>
          {showForm ? 'Fechar' : 'Nova conta'}
        </button>
      }
    >
      {showForm && (
        <Surface className="p-5 sm:p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Banco
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="Ex.: Millennium, Nubank"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none dark:border-white/[0.08] dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Nº da conta (opcional)
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="••••1234"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none dark:border-white/[0.08] dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Moeda
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:border-brand-400 focus:outline-none dark:border-white/[0.08] dark:bg-slate-700 dark:text-white"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Saldo atual (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value.replace(/[^\d,.]/g, '') })}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none dark:border-white/[0.08] dark:bg-slate-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="shrink-0 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-brand-300 disabled:opacity-60"
                >
                  {isSaving ? <i className="fas fa-spinner fa-spin"></i> : 'Salvar'}
                </button>
              </div>
            </div>
          </form>
        </Surface>
      )}

      {isLoading && accounts.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent"></span>
        </div>
      ) : accounts.length === 0 ? (
        <Surface className="p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400 dark:bg-white/5 dark:text-slate-500">
            <i className="fas fa-building-columns"></i>
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
            Nenhuma conta cadastrada
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Cadastre as contas de vocês dois — ex.: a sua em euro e a dela em real. Ao lançar uma
            transação pela conta, a moeda já vem certa.
          </p>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const opt = currencyOption(account.currency);
            return (
              <Surface key={account.id} className="p-5">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                    <i className="fas fa-building-columns"></i>
                  </span>
                  <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-white/[0.08] dark:text-slate-400">
                    {opt.flag} {account.currency}
                  </span>
                </div>
                <p className="mt-3 font-medium text-slate-900 dark:text-white">{account.bankName}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {account.accountNumber ? `Conta ${account.accountNumber}` : 'Sem número'}
                  {account.user?.name ? ` · ${account.user.name}` : ''}
                </p>
                <p className="mt-3 font-display text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {formatMoney(account.balance, account.currency)}
                </p>
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                  <button
                    onClick={() => handleArchive(account.id)}
                    className={`text-xs font-medium transition-colors ${
                      confirmArchive === account.id
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-400 hover:text-red-500 dark:text-slate-500'
                    }`}
                  >
                    <i className="fas fa-box-archive mr-1.5"></i>
                    {confirmArchive === account.id ? 'Confirmar arquivamento?' : 'Arquivar'}
                  </button>
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
