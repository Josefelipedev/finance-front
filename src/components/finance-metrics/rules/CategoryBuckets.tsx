import { useMemo, useState } from 'react';
import { Surface } from '../../common/PageShell';
import Button from '../../ui/button/Button';
import type { Bucket, RuleCategory } from '../../../hooks/useRules';
import { BUCKETS, BUCKET_SHORT } from './buckets';

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

/**
 * Onde cada categoria cai.
 *
 * É o trabalho que torna o veredicto verdadeiro, e por isso vive por baixo
 * dele e não por cima: quem abre o ecrã vem ver como está, não vem arrumar.
 *
 * Por omissão mostra só o que **falta** — as que já foram decididas à mão não
 * precisam de ser revistas todos os dias, e uma lista de 40 categorias onde 38
 * estão feitas esconde as 2 que interessam.
 */
export default function CategoryBuckets({
  categories,
  money,
  isSaving,
  onSetBuckets,
}: {
  categories: RuleCategory[];
  money: (v: number) => string;
  isSaving: boolean;
  onSetBuckets: (
    items: { categoryId: number; bucket: Bucket | null }[],
  ) => Promise<unknown>;
}) {
  const [showAll, setShowAll] = useState(false);

  const pending = useMemo(
    () =>
      categories
        .filter((c) => c.source !== 'manual')
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount),
    [categories],
  );
  const sorted = useMemo(
    () => [...categories].sort((a, b) => b.monthlyAmount - a.monthlyAmount),
    [categories],
  );
  const guessCount = pending.filter((c) => c.source === 'guess').length;

  const visible = showAll ? sorted : pending;

  return (
    <Surface className="p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
          Onde cada categoria cai
        </h3>
        {sorted.length > pending.length && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            {showAll ? 'Ver só as que faltam' : `Ver todas (${sorted.length})`}
          </button>
        )}
      </div>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Clica no balde que já está escolhido para o desfazer e voltar ao palpite.
      </p>

      {guessCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="mb-3"
          disabled={isSaving}
          onClick={() => {
            const items = pending
              .filter((c) => c.source === 'guess' && c.categoryId != null && c.bucket)
              .map((c) => ({
                categoryId: c.categoryId as number,
                bucket: c.bucket as Bucket,
              }));
            if (items.length) void onSetBuckets(items);
          }}
        >
          Aceitar os {guessCount} palpites
        </Button>
      )}

      <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {visible.map((category) => (
          <CategoryRow
            key={category.categoryId ?? category.name}
            category={category}
            money={money}
            disabled={isSaving}
            onPick={(bucket) => {
              if (category.categoryId == null) return;
              void onSetBuckets([{ categoryId: category.categoryId, bucket }]);
            }}
          />
        ))}
        {visible.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Está tudo arrumado. O veredicto acima é inteiramente teu.
          </li>
        )}
      </ul>
    </Surface>
  );
}
