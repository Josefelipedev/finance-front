/**
 * Datas civis no cliente — o espelho do `civil-date.ts` da API.
 *
 * O servidor grava um DIA do calendário à meia-noite UTC (`referenceDate`,
 * `dueDate`, `weekStart`, `startDate`/`endDate`). Formatar isso com
 * `new Date(iso).toLocaleDateString()` interpreta-o como um INSTANTE e
 * traduz-o para o fuso do browser — a oeste de Greenwich dá o dia anterior:
 *
 *     2026-08-20T00:00:00Z  →  Lisboa 20/08   ·  São Paulo 19/08
 *
 * O mesmo lançamento, dois dias diferentes conforme quem olha. A regra é ler o
 * dia como texto e deixar o relógio de fora: `YYYY-MM-DD` mais meia-noite
 * LOCAL, que formata igual em qualquer sítio. É o que o `BillsPage`, o
 * `FiscalPage` e o calendário já faziam à mão, cada um por si.
 *
 * ⚠️ Não usar em `createdAt`, `paidAt` ou `updatedAt`: esses são instantes de
 * verdade e devem mesmo aparecer na hora de quem lê.
 */

/** O `Date` de um dia civil, à meia-noite local — seguro para formatar. */
export function civilDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00`);
}

/** Um dia civil escrito por extenso, igual em qualquer fuso. */
export function formatCivilDate(
  iso: string | null | undefined,
  locale = 'pt-BR',
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return '-';
  const date = civilDate(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(locale, options);
}
