const NOMES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/**
 * `2028-01` → `jan/2028`.
 *
 * Os meses do planeamento andam como `AAAA-MM` porque é assim que atravessam a
 * API sem apanhar fusos — mas é uma chave, não uma legenda, e estava a chegar
 * crua ao ecrã dos cenários.
 */
export const monthLabel = (key: string): string => {
  const [year, month] = key.split('-');
  const nome = NOMES[Number(month) - 1];
  return nome ? `${nome}/${year}` : key;
};
