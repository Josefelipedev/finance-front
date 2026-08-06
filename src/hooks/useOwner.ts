import { useEffect, useMemo } from 'react';
import { useUserProfile, UserProfile } from './useUserProfile';

export interface OwnerNaming {
  /**
   * `true` só quando o workspace é partilhado (há cônjuge ligado). Num
   * workspace de uma pessoa só, dizer "quem criou" é ruído: é sempre ela.
   */
  isShared: boolean;
  /** O id de quem está autenticado, ou `null` enquanto o perfil não chega. */
  myId: number | null;
  /**
   * Nome curto de quem criou o registo, ou `null` quando não há nada útil a
   * mostrar (workspace individual, ou registo sem `userId`). Quem chama pode
   * usar o `null` para não desenhar nada.
   */
  ownerName: (userId?: number | null) => string | null;
  /** `true` quando o registo é de quem está autenticado. */
  isMine: (userId?: number | null) => boolean;
}

/** "Maria Silva" → "Maria". O apelido não cabe num chip e não desambigua nada. */
function firstName(name?: string | null): string | null {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first || null;
}

/**
 * Como identificar o autor de um registo no workspace do casal.
 *
 * O `userId` de cada registo (transação, conta, recorrente) já diz quem o
 * criou — é a coluna por onde o `coupleUserIds` do servidor faz o escopo. Só
 * faltava traduzi-lo para um nome, e o perfil traz os dois nomes que existem
 * no workspace: o próprio e o do cônjuge.
 *
 * Versão pura para quem já tem o perfil carregado — não busca nada, para não
 * duplicar o pedido nas páginas que já chamam `getProfile`.
 */
export function ownerNaming(profile: UserProfile | null): OwnerNaming {
  const spouseId = profile?.spouse?.id ?? profile?.spouseId ?? null;
  const isShared = Boolean(profile?.isMarried && spouseId);
  const myId = profile?.id ?? null;

  return {
    isShared,
    myId,
    isMine: (userId) => userId != null && myId != null && userId === myId,
    ownerName: (userId) => {
      if (!isShared || userId == null) return null;
      if (userId === myId) return 'Você';
      if (userId === spouseId) return firstName(profile?.spouse?.name) ?? 'Parceiro(a)';
      // Um id que não é nem o meu nem o do cônjuge não devia chegar aqui (o
      // servidor filtra por `coupleUserIds`), mas inventar um nome seria pior
      // do que admitir que não se sabe.
      return 'Outro';
    },
  };
}

/** Igual a `ownerNaming`, mas carrega o perfil sozinho. */
export function useOwnerNaming(): OwnerNaming {
  const { profile, getProfile } = useUserProfile();

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  return useMemo(() => ownerNaming(profile), [profile]);
}
