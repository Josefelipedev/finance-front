import { useEffect, useState } from 'react';
import { Surface } from '../../common/PageShell';
import Button from '../../ui/button/Button';
import MoneyInput from '../../form/MoneyInput';
import { currencyOption, formatMoney } from '../../../utils/currency';
import type { ImpliedRate, ImportCandidate } from '../../../hooks/useDebts';
import { KIND_LABEL } from './kinds';

interface Props {
  isSaving?: boolean;
  getCandidates: () => Promise<ImportCandidate[]>;
  onImport: (input: {
    recurringId?: number;
    accountId?: number;
    annualInterestRate?: number;
  }) => Promise<unknown>;
  /** Calcula o juro a partir do preço a pronto — não escreve nada. */
  calcImpliedRate: (input: {
    cashPrice: number;
    instalment: number;
    count: number;
  }) => Promise<ImpliedRate>;
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
  calcImpliedRate,
  refreshKey,
}: Props) {
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  /** Preço a pronto escrito por linha, e o que a conta devolveu. */
  const [cashPrices, setCashPrices] = useState<Record<string, number>>({});
  const [computed, setComputed] = useState<Record<string, ImpliedRate>>({});
  const [computing, setComputing] = useState<string | null>(null);

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
              Juro % ao ano
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

            {/*
              Quase ninguém sabe o juro do seu parcelamento — mas toda a gente
              viu o preço a pronto na montra. Com o preço e a prestação, o juro
              é uma conta, e escrevê-lo a olho era como a Havan ficou com 15%
              quando na verdade não tem juro nenhum.
            */}
            <div className="w-full basis-full">
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Não sabes o juro? Escreve o preço a pronto:
                </span>
                <div className="w-32">
                  <MoneyInput
                    value={cashPrices[chave(c)] ?? 0}
                    onChange={(v) =>
                      setCashPrices((prev) => ({ ...prev, [chave(c)]: v }))
                    }
                    currencySymbol={currencyOption(c.currency).symbol}
                    placeholder="à vista"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={
                    computing === chave(c) ||
                    !(cashPrices[chave(c)] > 0) ||
                    !(c.minimumPayment > 0)
                  }
                  onClick={async () => {
                    const k = chave(c);
                    setComputing(k);
                    try {
                      // As prestações que faltam não servem: o juro está no
                      // contrato inteiro, e o preço a pronto é o do início.
                      const count = Math.max(
                        1,
                        Math.round(c.originalAmount / c.minimumPayment),
                      );
                      const r = await calcImpliedRate({
                        cashPrice: cashPrices[k],
                        instalment: c.minimumPayment,
                        count,
                      });
                      setComputed((prev) => ({ ...prev, [k]: r }));
                      if (r.annualNominalRate != null) {
                        setRates((prev) => ({ ...prev, [k]: r.annualNominalRate as number }));
                      }
                    } finally {
                      setComputing(null);
                    }
                  }}
                >
                  {computing === chave(c) ? 'A calcular…' : 'Calcular'}
                </Button>
              </div>

              {computed[chave(c)] && (
                <p className="mt-1.5 px-3 text-xs">
                  {computed[chave(c)].status === 'ok' ? (
                    <span className="text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">
                        {computed[chave(c)].monthlyRate}% ao mês
                      </strong>{' '}
                      · {computed[chave(c)].annualNominalRate}% ao ano nominal ·{' '}
                      {computed[chave(c)].annualEffectiveRate}% efectivo. Pagas{' '}
                      {formatMoney(computed[chave(c)].totalPaid, c.currency)}, dos quais{' '}
                      {formatMoney(computed[chave(c)].totalInterest, c.currency)} são juro
                      ({computed[chave(c)].surchargePct}% mais caro).
                    </span>
                  ) : computed[chave(c)].status === 'no_interest' ? (
                    <span className="text-success-600 dark:text-success-400">
                      Sem juro nenhum — pagas exactamente o preço a pronto.
                    </span>
                  ) : computed[chave(c)].status === 'discount' ? (
                    <span className="text-success-600 dark:text-success-400">
                      Não há juro: pagas{' '}
                      {formatMoney(Math.abs(computed[chave(c)].totalInterest), c.currency)} a
                      MENOS do que o preço a pronto. Confirma os números — ou é mesmo um
                      desconto.
                    </span>
                  ) : (
                    <span className="text-warning-600 dark:text-warning-400">
                      Esses números não descrevem um parcelamento.
                    </span>
                  )}
                </p>
              )}
            </div>

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
