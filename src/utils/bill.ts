/** `2026-08-10T00:00:00.000Z` → `10/08`. */
export function billDueLabel(dueDate: string): string {
  const [ano, mes, dia] = dueDate.slice(0, 10).split('-');
  return ano ? `${dia}/${mes}` : dueDate;
}

/**
 * O mês da conta (`AAAA-MM`), para abrir o ecrã de Contas já no sítio certo.
 *
 * A fatia da string é de propósito: `new Date(...)` sobre a data de vencimento
 * traria o fuso do browser para uma data que a API grava à meia-noite UTC, e
 * quem estivesse a oeste de Greenwich saltava para o mês anterior.
 */
export function billMonth(dueDate: string): string {
  return dueDate.slice(0, 7);
}
