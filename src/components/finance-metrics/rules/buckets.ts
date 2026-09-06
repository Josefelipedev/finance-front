import type { Bucket } from '../../../hooks/useRules';

/**
 * O vocabulário dos baldes, num sítio só.
 *
 * Vive fora dos componentes porque é partilhado por quatro ecrãs — as regras,
 * as contas a pagar, o cartão do Dashboard e a lista de categorias — e uma cor
 * que só combina em três deles é pior do que não ter cor nenhuma.
 */
export const BUCKETS: Bucket[] = ['needs', 'wants', 'savings'];

export const BUCKET_LABEL: Record<Bucket, string> = {
  needs: 'Necessidades',
  wants: 'Desejos',
  savings: 'Poupança',
};

/** O singular, para caber num botão ou num chip de linha. */
export const BUCKET_SHORT: Record<Bucket, string> = {
  needs: 'Necessidade',
  wants: 'Desejo',
  savings: 'Poupança',
};

export const BUCKET_HINT: Record<Bucket, string> = {
  needs: 'O que não se evita: casa, comida, transporte, saúde, prestações.',
  wants: 'O que se escolhe: restaurantes, viagens, subscrições, lazer.',
  savings: 'O que fica: metas, investimentos e o que sobra na conta.',
};

/** A cor de preenchimento de uma barra. */
export const BUCKET_BAR: Record<Bucket, string> = {
  needs: 'bg-brand-400',
  wants: 'bg-warning-400',
  savings: 'bg-success-500',
};

/** A mesma cor, em versão chip legível por cima de um fundo claro e escuro. */
export const BUCKET_CHIP: Record<Bucket, string> = {
  needs: 'bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300',
  wants:
    'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  savings:
    'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400',
};
