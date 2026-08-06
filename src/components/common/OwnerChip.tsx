interface Props {
  /** Nome já resolvido (de `ownerName`). `null`/vazio → não desenha nada. */
  name: string | null;
  /** Registo de quem está autenticado: fica em cinza, para não competir. */
  mine?: boolean;
  className?: string;
}

/**
 * Quem criou o registo, no workspace do casal.
 *
 * O do parceiro leva o acento e o próprio fica neutro: a pergunta que se faz a
 * uma lista partilhada é "o que aqui não fui eu que lancei", e é essa que o
 * olho tem de responder sem ler.
 */
export default function OwnerChip({ name, mine = false, className = '' }: Props) {
  if (!name) return null;

  return (
    <span
      title={mine ? 'Lançado por si' : `Lançado por ${name}`}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
        mine
          ? 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400'
          : 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400'
      } ${className}`}
    >
      <i className="fas fa-user text-[9px]"></i>
      {name}
    </span>
  );
}
