export type DateRange = { startDate: string; endDate: string };

/** Período padrão das telas financeiras: últimos 30 dias. */
export function defaultDateRange(): DateRange {
  return {
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    endDate: new Date().toISOString(),
  };
}
