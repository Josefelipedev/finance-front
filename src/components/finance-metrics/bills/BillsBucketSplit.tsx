import { Link } from 'react-router';
import { Surface } from '../../common/PageShell';
import { formatMoney } from '../../../utils/currency';
import { BUCKETS, BUCKET_BAR, BUCKET_LABEL } from '../rules/buckets';

type ByBucket = {
  needs: number;
  wants: number;
  savings: number;
  unclassified: number;
};

/**
 * O mês repartido pelos baldes da regra.
 *
 * A lista das contas responde a "o que tenho de pagar". Não responde à
 * pergunta que se faz a seguir, quando o mês aperta: **o que é que eu POSSO
 * cortar?**. Uma renda e um streaming são a mesma linha numa lista ordenada
 * por data, e são coisas completamente diferentes de olhar.
 *
 * Só despesa entra — repartir receita em necessidades e desejos não quer dizer
 * nada — e conta o pago junto com o por pagar, porque o que já se pagou também
 * foi uma escolha e conta para o mês.
 *
 * O que não tem balde aparece à parte, com o convite para ir arrumá-lo. Metê-lo
 * dentro de um dos três fazia o corte parecer maior do que é.
 */
export default function BillsBucketSplit({
  byBucket,
  currency,
  isSafe,
}: {
  byBucket: ByBucket | undefined;
  currency: string;
  /** Falso quando faltam taxas de câmbio: não se somam moedas sem converter. */
  isSafe: boolean;
}) {
  if (!byBucket) return null;

  const total =
    byBucket.needs + byBucket.wants + byBucket.savings + byBucket.unclassified;
  if (total <= 0.005) return null;

  const money = (v: number) => formatMoney(v, currency);
  const pct = (v: number) => Math.round((v / total) * 100);

  return (
    <Surface className="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
          O que dá para cortar
        </h3>
        <Link
          to="/orcamento"
          className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          Ver a regra →
        </Link>
      </div>

      {!isSafe ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Faltam taxas de câmbio, por isso a divisão fica escondida — somar moedas
          sem converter dá um número plausível e errado.
        </p>
      ) : (
        <>
          {/* Uma barra só, repartida: é a proporção que interessa ver, e três
              barras separadas obrigavam a compará-las de cabeça. */}
          <div className="flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            {BUCKETS.map((bucket) =>
              byBucket[bucket] > 0.005 ? (
                <div
                  key={bucket}
                  className={BUCKET_BAR[bucket]}
                  style={{ width: `${(byBucket[bucket] / total) * 100}%` }}
                  title={`${BUCKET_LABEL[bucket]}: ${money(byBucket[bucket])}`}
                />
              ) : null,
            )}
            {byBucket.unclassified > 0.005 && (
              <div
                className="bg-gray-300 dark:bg-gray-600"
                style={{ width: `${(byBucket.unclassified / total) * 100}%` }}
                title={`Por classificar: ${money(byBucket.unclassified)}`}
              />
            )}
          </div>

          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            {BUCKETS.map((bucket) => (
              <li key={bucket}>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span
                    className={`h-2 w-2 rounded-full ${BUCKET_BAR[bucket]}`}
                    aria-hidden
                  />
                  {BUCKET_LABEL[bucket]}
                </span>
                <span className="mt-0.5 block font-display text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {money(byBucket[bucket])}
                  <span className="ml-1.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                    {pct(byBucket[bucket])}%
                  </span>
                </span>
              </li>
            ))}
            {byBucket.unclassified > 0.005 && (
              <li>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span
                    className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600"
                    aria-hidden
                  />
                  Por classificar
                </span>
                <span className="mt-0.5 block font-display text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                  {money(byBucket.unclassified)}
                  <span className="ml-1.5 text-xs font-normal">
                    {pct(byBucket.unclassified)}%
                  </span>
                </span>
              </li>
            )}
          </ul>

          {byBucket.wants > 0.005 && (
            <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600 dark:border-white/[0.06] dark:text-gray-300">
              <strong className="font-semibold text-gray-900 dark:text-white">
                {money(byBucket.wants)}
              </strong>{' '}
              deste mês são coisas que escolheste — é por aí que se corta primeiro,
              se for preciso.
            </p>
          )}
        </>
      )}
    </Surface>
  );
}
