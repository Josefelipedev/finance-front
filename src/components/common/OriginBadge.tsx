import { Link } from 'react-router';
import type { FinanceOrigin } from '../../hooks/useFinance';

interface Props {
  origin: FinanceOrigin;
  className?: string;
}

/**
 * De onde veio um lançamento que a app criou sozinha (T6.6).
 *
 * Cinco módulos emitem lançamentos — contas a pagar, metas, listas de compras,
 * cardápio, e a mão do utilizador — e na lista eram todos linhas iguais. Sem
 * isto não há forma de ver que a mesma compra foi contada duas vezes, uma pela
 * lista fechada e outra à mão. A app não tenta adivinhar duplicados: mostra a
 * origem e deixa a pessoa ver.
 *
 * O caso da conta a pagar tem crachá próprio (`BillLinkBadge`), que já mostra o
 * vencimento e leva ao mês certo.
 */
const ESTILO: Record<
  string,
  { icone: string; texto: string; destino?: (refId: number) => string; ajuda: string }
> = {
  goal: {
    icone: 'fa-piggy-bank',
    texto: 'Meta',
    destino: () => '/metas',
    ajuda: 'Depósito numa meta — é uma transferência, não uma despesa: o dinheiro saiu da conta mas continua a ser teu',
  },
  shopping: {
    icone: 'fa-basket-shopping',
    texto: 'Compras',
    destino: () => '/compras',
    ajuda: 'Despesa criada ao fechar uma lista de compras — reabrir a lista apaga-a',
  },
  meal: {
    icone: 'fa-utensils',
    texto: 'Cardápio',
    destino: () => '/meal-planner',
    ajuda: 'Despesa criada ao fechar a lista de compras do cardápio — reabrir apaga-a',
  },
};

export default function OriginBadge({ origin, className = '' }: Props) {
  const estilo = ESTILO[origin.kind];
  if (!estilo) return null;

  const conteudo = (
    <>
      <i className={`fas ${estilo.icone} text-[9px]`}></i>
      {estilo.texto}
      {origin.label && origin.label !== estilo.texto ? ` · ${origin.label}` : ''}
    </>
  );

  const classes = `inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 transition-colors hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08] ${className}`;

  return estilo.destino ? (
    <Link to={estilo.destino(origin.refId)} title={estilo.ajuda} className={classes}>
      {conteudo}
    </Link>
  ) : (
    <span title={estilo.ajuda} className={classes}>
      {conteudo}
    </span>
  );
}
