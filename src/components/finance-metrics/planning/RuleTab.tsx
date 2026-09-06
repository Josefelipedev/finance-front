import { useMemo, useState } from 'react';
import { Surface } from '../../common/PageShell';
import MixedCurrencyWarning from '../../common/MixedCurrencyWarning';
import Button from '../../ui/button/Button';
import { formatMoney } from '../../../utils/currency';
import { monthLabel } from '../../../utils/month';
import type {
  Bucket,
  BucketVerdict,
  RuleCategory,
  SpendingRule,
} from '../../../hooks/usePlanning';

interface Props {
  data: SpendingRule | null;
  isLoading: boolean;
  isSaving: boolean;
  onSaveRule: (input: {
    preset?: string;
    needsPct?: number;
    wantsPct?: number;
    savingsPct?: number;
  }) => Promise<unknown>;
  onSetBuckets: (
    items: { categoryId: number; bucket: Bucket | null }[],
  ) => Promise<unknown>;
}

const BUCKET_LABEL: Record<Bucket, string> = {
  needs: 'Necessidades',
  wants: 'Desejos',
  savings: 'Poupança',
};

const BUCKET_SHORT: Record<Bucket, string> = {
  needs: 'Necessidade',
  wants: 'Desejo',
  savings: 'Poupança',
};

const BUCKET_HINT: Record<Bucket, string> = {
  needs: 'O que não se evita: casa, comida, transporte, saúde, prestações.',
  wants: 'O que se escolhe: restaurantes, viagens, subscrições, lazer.',
  savings: 'O que fica: metas, investimentos e o que sobra na conta.',
};

/** Cada balde tem uma cor e ela não muda entre a barra e a lista. */
const BUCKET_BAR: Record<Bucket, string> = {
  needs: 'bg-brand-400',
  wants: 'bg-warning-400',
  savings: 'bg-success-500',
};

const BUCKETS: Bucket[] = ['needs', 'wants', 'savings'];

/**
 * Um balde: quanto devia ser, quanto é, e a diferença em dinheiro.
 *
 * A barra desenha o **real** contra o rendimento, com uma marca no alvo. O
 * contrário — encher a barra até ao alvo — escondia exatamente o caso que
 * interessa ver, que é o de estar por cima dele.
 */
function BucketBar({
  verdict,
  money,
}: {
  verdict: BucketVerdict;
  money: (v: number) => string;
}) {
  const { bucket, actualPct, targetPct, deltaAmount } = verdict;
  // Uma barra que cresce sem limite deixa de ser comparável; acima de 100% do
  // rendimento o número continua escrito, é a barra que satura.
  const width = Math.min(100, Math.max(0, actualPct ?? 0));
  const over = deltaAmount > 0.005;
  const under = deltaAmount < -0.005;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {BUCKET_LABEL[bucket]}
          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
            alvo {targetPct}%
          </span>
        </span>
        <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
          <strong className="font-semibold text-gray-900 dark:text-white">
            {money(verdict.actualAmount)}
          </strong>
          {actualPct != null && (
            <span className="ml-2 text-gray-500 dark:text-gray-400">{actualPct}%</span>
          )}
        </span>
      </div>

      <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full ${BUCKET_BAR[bucket]}`}
          style={{ width: `${width}%` }}
        />
        {/*
          A marca do alvo por cima da barra. Sem ela, "54%" só se compara com o
          alvo lendo o número — e o ponto de um gráfico é não ter de o ler.
        */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-900/60 dark:bg-white/60"
          style={{ left: `${Math.min(100, targetPct)}%` }}
          aria-hidden
        />
      </div>

      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        {actualPct == null ? (
          BUCKET_HINT[bucket]
        ) : over ? (
          <span className={bucket === 'savings' ? 'text-success-600 dark:text-success-400' : 'text-error-500 dark:text-error-400'}>
            {money(Math.abs(deltaAmount))} {bucket === 'savings' ? 'acima do alvo' : 'a mais do que a regra pede'}
          </span>
        ) : under ? (
          <span className={bucket === 'savings' ? 'text-error-500 dark:text-error-400' : 'text-success-600 dark:text-success-400'}>
            {money(Math.abs(deltaAmount))} {bucket === 'savings' ? 'abaixo do alvo' : 'de folga'}
          </span>
        ) : (
          'Em cima do alvo.'
        )}
      </p>
    </div>
  );
}

/** Os três botões que arrumam uma categoria — ou a devolvem ao palpite. */
function BucketPicker({
  value,
  disabled,
  onPick,
}: {
  value: Bucket | null;
  disabled: boolean;
  onPick: (bucket: Bucket | null) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
      {BUCKETS.map((bucket) => (
        <button
          key={bucket}
          type="button"
          disabled={disabled}
          aria-pressed={value === bucket}
          // Clicar no balde que já está escolhido desfá-lo: é a única maneira
          // de voltar ao palpite sem um quarto botão a dizer "limpar".
          onClick={() => onPick(value === bucket ? null : bucket)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
            value === bucket
              ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-white/[0.08] dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {BUCKET_SHORT[bucket]}
        </button>
      ))}
    </div>
  );
}

/**
 * A regra do dinheiro: 50/30/20 e as suas primas.
 *
 * As outras abas perguntam "onde é que isto vai dar". Esta pergunta outra
 * coisa, e mais imediata: *o que ganho está a ser dividido como devia?*. Um
 * orçamento por categoria nunca responde a isso, porque soma tectos sem os
 * comparar com o rendimento.
 *
 * O ecrã tem duas metades e a ordem entre elas é deliberada: primeiro o
 * veredicto (que é o que se veio ver), e por baixo a arrumação das categorias
 * (que é o trabalho que o torna verdadeiro). Quando há categorias por
 * classificar, isso aparece **entre** as duas — porque nesse caso o veredicto
 * ainda não está completo, e dizê-lo é mais útil do que escondê-lo.
 */
export default function RuleTab({
  data,
  isLoading,
  isSaving,
  onSaveRule,
  onSetBuckets,
}: Props) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState<{ needs: number; wants: number } | null>(null);

  const money = useMemo(() => {
    const currency = data?.displayCurrency ?? 'EUR';
    return (v: number) => formatMoney(v, currency);
  }, [data?.displayCurrency]);

  const pending = useMemo(
    () =>
      (data?.categories ?? [])
        .filter((c) => c.source !== 'manual')
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount),
    [data?.categories],
  );

  const sorted = useMemo(
    () => [...(data?.categories ?? [])].sort((a, b) => b.monthlyAmount - a.monthlyAmount),
    [data?.categories],
  );

  if (isLoading && !data) {
    return (
      <Surface className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
        A dividir o teu dinheiro em três...
      </Surface>
    );
  }

  if (!data) return null;

  const { rule, presets, verdict, basis } = data;
  // O que nem o palpite soube nomear, mais o que não tem categoria nenhuma:
  // são coisas diferentes de arrumar, mas o mesmo buraco no veredicto.
  const unknownCount = pending.filter((c) => c.source === 'unknown').length;
  const guessCount = pending.filter((c) => c.source === 'guess').length;

  const custom = draft ?? {
    needs: rule.needsPct,
    wants: rule.wantsPct,
  };
  const customSavings = 100 - custom.needs - custom.wants;

  const setBucket = (categoryId: number | null, bucket: Bucket | null) => {
    if (categoryId == null) return;
    void onSetBuckets([{ categoryId, bucket }]);
  };

  /** Aceita todos os palpites de uma vez — é o atalho de quem confia neles. */
  const acceptAllGuesses = () => {
    const items = pending
      .filter((c) => c.source === 'guess' && c.categoryId != null && c.bucket)
      .map((c) => ({ categoryId: c.categoryId as number, bucket: c.bucket as Bucket }));
    if (items.length) void onSetBuckets(items);
  };

  return (
    <div className="space-y-5">
      <MixedCurrencyWarning
        currencies={data.unconvertedCurrencies}
        outOfRange={data.outOfRangeDates}
        rateDate={data.rateDate}
      />

      {/* ── A regra escolhida ─────────────────────────────────────────── */}
      <Surface className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
            A tua regra
          </h3>
          {rule.isDefault && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Ainda ninguém escolheu — está a valer a clássica.
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {presets.map((preset) => {
            const active = !customOpen && rule.preset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setCustomOpen(false);
                  setDraft(null);
                  void onSaveRule({ preset: preset.key });
                }}
                className={`rounded-xl border p-3 text-left transition-colors disabled:opacity-60 ${
                  active
                    ? 'border-brand-400 bg-brand-50 dark:border-brand-400/40 dark:bg-brand-400/[0.08]'
                    : 'border-gray-200 hover:border-gray-300 dark:border-white/[0.06] dark:hover:border-white/[0.12]'
                }`}
              >
                <span className="font-display text-sm font-semibold text-gray-900 dark:text-white">
                  {preset.name}
                </span>
                <span className="mt-1 block text-xs leading-snug text-gray-500 dark:text-gray-400">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className="mt-3 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          {customOpen ? 'Esconder' : 'Escrever as minhas percentagens'}
          {rule.preset === 'custom' && !customOpen && (
            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
              (a valer: {rule.needsPct}/{rule.wantsPct}/{rule.savingsPct})
            </span>
          )}
        </button>

        {customOpen && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
            {(['needs', 'wants'] as const).map((key) => (
              <label key={key} className="block">
                <span className="flex items-baseline justify-between text-sm text-gray-700 dark:text-gray-300">
                  {BUCKET_LABEL[key]}
                  <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                    {custom[key]}%
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={custom[key]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const other = key === 'needs' ? custom.wants : custom.needs;
                    // As três somam 100 sempre. Empurrar a outra fatia para
                    // baixo é o que evita um estado inválido que só o servidor
                    // recusaria, depois de o utilizador já ter arrastado.
                    const clamped = Math.min(value, 100);
                    const nextOther = Math.min(other, 100 - clamped);
                    setDraft(
                      key === 'needs'
                        ? { needs: clamped, wants: nextOther }
                        : { needs: nextOther, wants: clamped },
                    );
                  }}
                  className="mt-1.5 w-full accent-brand-400"
                />
              </label>
            ))}
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Poupança:{' '}
              <strong className="tabular-nums font-semibold text-gray-900 dark:text-white">
                {customSavings}%
              </strong>{' '}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                — é o que sobra das outras duas.
              </span>
            </p>
            <Button
              size="sm"
              type="button"
              disabled={isSaving}
              onClick={() => {
                void onSaveRule({
                  preset: 'custom',
                  needsPct: custom.needs,
                  wantsPct: custom.wants,
                  savingsPct: customSavings,
                }).then(() => {
                  setCustomOpen(false);
                  setDraft(null);
                });
              }}
            >
              Guardar esta regra
            </Button>
          </div>
        )}
      </Surface>

      {/* ── O veredicto ───────────────────────────────────────────────── */}
      <Surface className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
            Como o teu dinheiro se divide
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {basis.monthsCovered > 0
              ? `Média de ${basis.monthsCovered} ${basis.monthsCovered === 1 ? 'mês' : 'meses'} (${monthLabel(basis.window.start)} a ${monthLabel(basis.window.end)})`
              : 'Sem histórico ainda'}
          </span>
        </div>

        {!verdict.hasIncome ? (
          <p className="rounded-lg bg-warning-50 px-3 py-2.5 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            <strong>Sem receita registada neste período.</strong> A regra é uma
            proporção do que entra: sem saber quanto entra, os valores abaixo são o
            que sai e mais nada — nenhuma percentagem seria verdadeira.
          </p>
        ) : (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Entram{' '}
            <strong className="font-semibold text-gray-900 dark:text-white">
              {money(verdict.income)}
            </strong>{' '}
            por mês. É esta a base de que as percentagens falam.
          </p>
        )}

        <div className="space-y-4">
          {verdict.buckets.map((bucket) => (
            <BucketBar key={bucket.bucket} verdict={bucket} money={money} />
          ))}
        </div>

        {basis.partialMonth && (
          <p className="mt-4 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            Ainda não há um mês fechado, por isso a conta é feita com o mês
            corrente — que vai a meio. Vai parecer que se gasta menos do que se
            gasta até o mês acabar.
          </p>
        )}

        {verdict.leftover < -0.005 && (
          <p className="mt-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            <strong>Sai mais do que entra:</strong> {money(Math.abs(verdict.leftover))} por
            mês a menos. Enquanto isto durar, a poupança que aparece acima é só o que
            se depositou de propósito — o resto veio de reservas.
          </p>
        )}
      </Surface>

      {/* ── O que ainda não está arrumado ─────────────────────────────── */}
      {(unknownCount > 0 || guessCount > 0 || data.uncategorizedAmount > 0.005) && (
        <Surface className="border-warning-200 p-4 dark:border-warning-500/30 sm:p-5">
          <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
            O veredicto ainda não está completo
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            {guessCount > 0 && (
              <li>
                <strong className="text-gray-900 dark:text-white">
                  {guessCount} {guessCount === 1 ? 'categoria' : 'categorias'}
                </strong>{' '}
                entraram por palpite do nome. Estão a contar, mas ninguém confirmou.
              </li>
            )}
            {unknownCount > 0 && (
              <li>
                <strong className="text-gray-900 dark:text-white">
                  {unknownCount} {unknownCount === 1 ? 'categoria' : 'categorias'}
                </strong>{' '}
                ({money(verdict.unclassifiedAmount - data.uncategorizedAmount)}/mês) não
                estão em balde nenhum — ficam de fora dos três acima, não escondidas
                dentro de um deles.
              </li>
            )}
            {data.uncategorizedAmount > 0.005 && (
              <li>
                <strong className="text-gray-900 dark:text-white">
                  {money(data.uncategorizedAmount)}/mês
                </strong>{' '}
                saíram sem categoria nenhuma. Esses só se arrumam pondo-lhes uma
                categoria nos lançamentos.
              </li>
            )}
          </ul>
          {guessCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              className="mt-3"
              disabled={isSaving}
              onClick={acceptAllGuesses}
            >
              Aceitar os {guessCount} palpites
            </Button>
          )}
        </Surface>
      )}

      {/* ── A arrumação ───────────────────────────────────────────────── */}
      <Surface className="p-4 sm:p-5">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
            Onde cada categoria cai
          </h3>
          {sorted.length > pending.length && (
            <button
              type="button"
              onClick={() => setShowAllCategories((v) => !v)}
              className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              {showAllCategories
                ? 'Ver só as que faltam'
                : `Ver todas (${sorted.length})`}
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Clica no balde que já está escolhido para o desfazer e voltar ao palpite.
        </p>

        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {(showAllCategories ? sorted : pending).map((category) => (
            <CategoryRow
              key={category.categoryId ?? category.name}
              category={category}
              money={money}
              disabled={isSaving}
              onPick={(bucket) => setBucket(category.categoryId, bucket)}
            />
          ))}
          {(showAllCategories ? sorted : pending).length === 0 && (
            <li className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Está tudo arrumado. O veredicto acima é inteiramente teu.
            </li>
          )}
        </ul>
      </Surface>
    </div>
  );
}

function CategoryRow({
  category,
  money,
  disabled,
  onPick,
}: {
  category: RuleCategory;
  money: (v: number) => string;
  disabled: boolean;
  onPick: (bucket: Bucket | null) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: category.color ?? '#9CA3AF' }}
            aria-hidden
          />
          <span className="truncate text-sm text-gray-900 dark:text-white">
            {category.name}
          </span>
          {category.source === 'guess' && (
            <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              palpite
            </span>
          )}
          {category.source === 'unknown' && (
            <span className="shrink-0 rounded-full bg-warning-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
              por classificar
            </span>
          )}
        </span>
        <span className="mt-0.5 block pl-4.5 text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {category.monthlyAmount > 0.005
            ? `${money(category.monthlyAmount)}/mês`
            : 'sem movimento no período'}
        </span>
      </span>
      <BucketPicker value={category.bucket} disabled={disabled} onPick={onPick} />
    </li>
  );
}
