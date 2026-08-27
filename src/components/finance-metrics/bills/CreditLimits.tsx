import { Link } from 'react-router';
import { BankAccount } from '../../../hooks/useBankAccounts';
import { formatMoney } from '../../../utils/currency';
import { Surface } from '../../common/PageShell';

export default function CreditLimits({ accounts }: { accounts: BankAccount[] }) {
  const withLimit = accounts.filter((account) => account.creditLimit != null);
  if (withLimit.length === 0) return null;

  return (
    <section aria-labelledby="credit-limits-title">
      <div className="mb-3 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
            Referência
          </p>
          <h2 id="credit-limits-title" className="font-display text-lg font-semibold text-gray-900 dark:text-white">
            Limites de crédito
          </h2>
        </div>
        <Link to="/contas" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Editar limites
        </Link>
      </div>

      <Surface className="overflow-hidden">
        <div className="grid divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-white/[0.06]">
          {withLimit.map((account) => (
            <div key={account.id} className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-white">{account.bankName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {[account.user?.name, account.currency].filter(Boolean).join(' · ')}
                </p>
              </div>
              {/*
                Quando se sabe a dívida, o número grande é o que ainda dá para
                gastar — o limite fica pequeno, por baixo. Sem dívida escrita,
                mostra-se só o limite: dizer "disponível" sem saber o que já se
                deve seria inventar.
              */}
              <div className="shrink-0 text-right">
                <p className="font-display text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                  {formatMoney(account.creditAvailable ?? account.creditLimit!, account.currency)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {account.creditAvailable != null
                    ? `disponível de ${formatMoney(account.creditLimit!, account.currency)}`
                    : 'limite · débito não informado'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-warning-200 bg-warning-50 px-5 py-3 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400">
          <i className="fas fa-shield-halved mr-2"></i>
          Limite de crédito e Pix crédito não são dinheiro livre.
        </div>
      </Surface>
    </section>
  );
}
