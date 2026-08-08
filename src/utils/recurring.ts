import type { RecurringTransaction } from '../hooks/useRecurringFinance';

/**
 * Quanto uma recorrente pesa por mês.
 *
 * As semanais usam 52/12 e não 4: doze meses de quatro semanas são 48 semanas,
 * e um encargo semanal contado assim ficava um mês inteiro mais barato por ano.
 * Mesma regra do `monthlyEquivalent` do servidor (`planning/projection.ts`) —
 * dois números diferentes para o mesmo compromisso é o que não pode acontecer.
 *
 * Frequências que o formulário não grava (a diária, só do bot) valem zero:
 * melhor não pesar do que pesar por um valor inventado.
 */
export function monthlyEquivalent(frequency: string, amount: number): number {
  switch (frequency) {
    case 'monthly':
      return amount;
    case 'weekly':
      return (amount * 52) / 12;
    case 'yearly':
      return amount / 12;
    default:
      return 0;
  }
}

/**
 * A recorrente já acabou — não há mais nada a pagar nem a receber por ela.
 *
 * Duas formas de acabar: a data de fim passou, ou já se pagaram todas as
 * parcelas contratadas (`executedCount` vem do servidor contando as contas
 * mesmo pagas, não é o contador da coluna, que nunca foi incrementado).
 */
export function isFinished(r: RecurringTransaction, now: Date = new Date()): boolean {
  if (r.endDate && new Date(r.endDate).getTime() < now.getTime()) return true;
  if (r.occurrences != null && r.occurrences > 0 && r.executedCount >= r.occurrences) return true;
  return false;
}

/**
 * O que ainda falta pagar de um parcelamento, na moeda da recorrente.
 *
 * `null` para uma assinatura sem fim: não há total contratado, e mostrar zero
 * diria que já não se deve nada — quando na verdade se paga para sempre.
 *
 * Trava em zero porque quem pagou acima do previsto (o ecrã de Contas
 * permite-o) não fica com um "falta pagar" negativo a descontar do resto.
 */
export function remainingTotal(r: RecurringTransaction): number | null {
  if (r.contractedTotal == null) return null;
  return Math.max(0, r.contractedTotal - (r.paidTotal ?? 0));
}

/**
 * Dá para dizer "paguei tudo" a esta recorrente?
 *
 * Só faz sentido onde existe um fim: uma subscrição sem número de parcelas
 * paga-se para sempre e não há "tudo" nenhum a liquidar. E não se quita o que
 * já está quitado — nem uma recorrente que já terminou.
 */
export function canSettle(r: RecurringTransaction, now: Date = new Date()): boolean {
  const falta = remainingTotal(r);
  return falta != null && falta > 0 && !isFinished(r, now);
}
