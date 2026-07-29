export type DateRange = { startDate: string; endDate: string };

/** Começo do dia (hora local) em ISO. */
export function startOfDayISO(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Fim do dia (hora local) em ISO.
 *
 * O filtro de período da API é `lte`: mandar a data "crua" (meia-noite) como
 * fim do intervalo excluía esse dia inteiro — na prática, os lançamentos de
 * hoje sumiam do dashboard sempre que se escolhia um período.
 */
export function endOfDayISO(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/** Período padrão das telas financeiras: últimos 30 dias, com o dia de hoje inteiro. */
export function defaultDateRange(): DateRange {
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 30);
  return {
    startDate: startOfDayISO(start),
    endDate: endOfDayISO(now),
  };
}
