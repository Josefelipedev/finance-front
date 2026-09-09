import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../ui/modal';
import Button from '../../ui/button/Button';
import MoneyInput from '../../form/MoneyInput';
import { currencyOption, formatMoney } from '../../../utils/currency';
import { useBankAccounts } from '../../../hooks/useBankAccounts';
import type { Debt } from '../../../hooks/useDebts';

interface Props {
  debt: Debt;
  isSaving?: boolean;
  onClose: () => void;
  onPay: (input: {
    amount: number;
    accountId?: number;
    ledger?: boolean;
    accrueInterest?: boolean;
  }) => Promise<void>;
}

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

/**
 * Pagar uma dívida.
 *
 * O modal diz de antemão para onde vai o dinheiro: quanto do que se paga é
 * juro e quanto abate mesmo o saldo. É a pergunta que faz as pessoas
 * desistirem de pagar o mínimo — e é impossível de responder olhando para o
 * extrato do banco.
 */
export default function PayDebtModal({ debt, isSaving, onClose, onPay }: Props) {
  const [amount, setAmount] = useState(debt.minimumPayment || 0);
  const [ledger, setLedger] = useState(true);
  const [accrueInterest, setAccrueInterest] = useState(debt.annualInterestRate > 0);
  const [accountId, setAccountId] = useState<number | ''>('');
  const { accounts, loadAccounts } = useBankAccounts();

  useEffect(() => {
    loadAccounts().catch(() => {});
  }, [loadAccounts]);

  const symbol = currencyOption(debt.currency).symbol;
  const money = (v: number) => formatMoney(v, debt.currency);

  /**
   * O juro corrido desde que a dívida entrou (ou desde o último pagamento) é
   * contado no servidor, que é quem sabe a data do último. Aqui mostra-se o
   * juro de UM MÊS como ordem de grandeza — chamar-lhe outra coisa seria
   * fingir uma precisão que o ecrã não tem.
   */
  const juroMensal = useMemo(
    () => (debt.currentBalance * (debt.annualInterestRate / 100)) / 12,
    [debt.currentBalance, debt.annualInterestRate],
  );

  const abatimento = accrueInterest ? Math.max(0, amount - juroMensal) : amount;
  const naoChega = accrueInterest && amount > 0 && amount < juroMensal;

  // Só contas na moeda da dívida: o lançamento nasce na moeda dela, e ligá-lo a
  // uma conta noutra moeda mexia num saldo com um número que não é dele.
  const contas = accounts.filter((a) => a.currency === debt.currency);

  return (
    <Modal isOpen onClose={onClose} className="max-w-md">
      <div className="p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
          Pagar «{debt.name}»
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Deve-se {money(debt.currentBalance)}
          {debt.annualInterestRate > 0 && ` · ${debt.annualInterestRate}% ao ano`}
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quanto vais pagar
            </label>
            <MoneyInput value={amount} onChange={setAmount} currencySymbol={symbol} />
            {debt.minimumPayment > 0 && (
              <button
                type="button"
                onClick={() => setAmount(debt.minimumPayment)}
                className="mt-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Usar o mínimo ({money(debt.minimumPayment)})
              </button>
            )}
          </div>

          {debt.annualInterestRate > 0 && accrueInterest && amount > 0 && (
            <div
              className={`rounded-lg px-3 py-2.5 text-sm ${
                naoChega
                  ? 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
                  : 'bg-gray-50 text-gray-600 dark:bg-white/[0.03] dark:text-gray-400'
              }`}
            >
              {naoChega ? (
                <>
                  <strong>Isto não chega para o juro.</strong> Com cerca de{' '}
                  {money(juroMensal)} de juro por mês, pagar {money(amount)} faz a
                  dívida <strong>subir</strong> em vez de descer.
                </>
              ) : (
                <>
                  Por mês corre cerca de <strong>{money(juroMensal)}</strong> de juro.
                  Destes {money(amount)}, à volta de{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {money(abatimento)}
                  </strong>{' '}
                  abatem mesmo o que se deve.
                </>
              )}
            </div>
          )}

          {contas.length > 0 && ledger && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                De que conta saiu
              </label>
              <select
                value={accountId}
                onChange={(e) =>
                  setAccountId(e.target.value === '' ? '' : Number(e.target.value))
                }
                className={INPUT}
              >
                <option value="">Não dizer</option>
                {contas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} {a.accountNumber}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Sem conta indicada, o lançamento existe mas nenhum saldo o sente.
              </p>
            </div>
          )}

          <label className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={ledger}
              onChange={(e) => setLedger(e.target.checked)}
              className="mt-0.5 accent-brand-400"
            />
            <span>
              Lançar como despesa
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Desliga se já lanças esta prestação à mão — senão fica contada duas
                vezes.
              </span>
            </span>
          </label>

          {debt.annualInterestRate > 0 && (
            <label className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={accrueInterest}
                onChange={(e) => setAccrueInterest(e.target.checked)}
                className="mt-0.5 accent-brand-400"
              />
              <span>
                Contar o juro corrido
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Desliga quando estás a copiar o saldo do extrato, onde o juro já
                  vem cobrado.
                </span>
              </span>
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSaving || !(amount > 0)}
            onClick={() => {
              void onPay({
                amount,
                accountId: accountId === '' ? undefined : accountId,
                ledger,
                accrueInterest,
              });
            }}
          >
            Pagar {money(amount)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
