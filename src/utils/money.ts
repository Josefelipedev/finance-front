/**
 * Dinheiro escrito à mão, em português.
 *
 * Um `<input type="number">` só entende o ponto como separador decimal (é o
 * HTML, não é o browser): quem escreve **1.160,56** — que é como se escreve cá
 * e no Brasil — vê o browser cortar no vírgula e o `parseFloat` devolver
 * **1.16**. O valor era gravado assim, sem aviso nenhum, e uma despesa de mil
 * e cento e sessenta euros ficava a valer um euro e dezasseis.
 *
 * Por isso os campos de dinheiro são `type="text"` com esta conversão à
 * frente, em vez de `type="number"`.
 */

/**
 * Lê o que a pessoa escreveu, aceitando as três formas que aparecem na prática:
 * `1.160,56` (pt/br), `1160,56` (só vírgula) e `1160.56` (teclado numérico ou
 * colado de outro sítio).
 *
 * A regra é a do **último separador**: se o que vem depois dele tem 1 ou 2
 * dígitos, é a parte decimal; tudo o resto são milhares e desaparece. É assim
 * que `1.160` dá 1160 (e não 1,16) e `1.16` dá 1,16.
 */
export function parseAmountInput(raw: string): number {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/[^\d.,-]/g, '');
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const lastSeparator = Math.max(lastComma, lastDot);

  if (lastSeparator === -1) return Number(cleaned) || 0;

  const decimals = cleaned.length - lastSeparator - 1;
  if (decimals >= 1 && decimals <= 2) {
    const integerPart = cleaned.slice(0, lastSeparator).replace(/[.,]/g, '');
    const decimalPart = cleaned.slice(lastSeparator + 1);
    return Number(`${integerPart}.${decimalPart}`) || 0;
  }

  // Sem parte decimal plausível (ex.: "1.160" ou "1,160"): tudo milhares.
  return Number(cleaned.replace(/[.,]/g, '')) || 0;
}

/** Como o valor aparece no campo quando não se está a escrever nele. */
export function formatAmountInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
