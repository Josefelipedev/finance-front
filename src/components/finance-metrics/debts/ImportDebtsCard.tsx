import { useEffect, useState } from 'react';
import { Surface } from '../../common/PageShell';
import Button from '../../ui/button/Button';
import { formatMoney } from '../../../utils/currency';
import type { ImportCandidate } from '../../../hooks/useDebts';
import { KIND_LABEL } from './kinds';

interface Props {
  isSaving?: boolean;
  getCandidates: () => Promise<ImportCandidate[]>;
  onImport: (input: {
    recurringId?: number;
    accountId?: number;
    annualInterestRate?: number;
  }) => Promise<unknown>;
  /** Muda sempre que a lista de dívidas muda — obriga a reler os candidatos. */
  refreshKey: number;
}

/**
 * Trazer para o plano o que já está na app.
 *
 * Existe para o número não ser escrito duas vezes. Quem tem um crédito de 48
 * prestações registado como recorrente, ou um cartão com o débito preenchido,
 * não devia reescrever o saldo à mão — e as duas cópias divergiriam ao primeiro
 * pagamento, sem ninguém dar por isso.
 */
export default function ImportDebtsCard({
  isSaving,
  getCandidates,
  onImport,
  refreshKey,
}: Props) {
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    getCandidates()
      .then((list) => setCandidates(list ?? []))
      .catch(() => setCandidates([]));
  }, [getCandidates, refreshKey]);

  if (candidates.length === 0) return null;

  const chave = (c: ImportCandidate) => `${c.source}:${c.recurringId ?? c.accountId}`;

  return (
    <Surface className="p-4 sm:p-5">
      <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
        Já está na app — trazer para o plano?
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Estes parcelamentos e cartões já têm saldo por pagar. Importá-los evita
        escrever o mesmo número duas vezes.
      </p>

      <ul className="mt-4 space-y-3">
        {candidates.map((c) => (
          <li
            key={chave(c)}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-200 p-3 dark:border-white/[0.06]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {c.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {KIND_LABEL[c.kind]} · falta {formatMoney(c.currentBalance, c.currency)}
                {c.minimumPayment > 0 &&
                  ` · ${formatMoney(c.minimumPayment, c.currency)}/mês`}
              </p>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              Juro %
              <input
                type="number"
                step="0.01"
                min={0}
                value={rates[chave(c)] ?? ''}
                placeholder="0"
                onChange={(e) =>
                  setRates((prev) => ({
                    ...prev,
                    [chave(c)]: Number(e.target.value) || 0,
                  }))
                }
                className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </label>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSaving}
              onClick={() =>
                void onImport({
                  recurringId: c.recurringId,
                  accountId: c.accountId,
                  annualInterestRate: rates[chave(c)] ?? 0,
                })
              }
            >
              Importar
            </Button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Nem o parcelamento nem o cartão sabem o juro do contrato — se o souberes,
        escreve-o aqui; é ele que decide a ordem na avalanche.
      </p>
    </Surface>
  );
}
