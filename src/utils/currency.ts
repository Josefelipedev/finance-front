export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AOA' | 'MZN' | 'CHF';

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  flag: string;
  label: string;
  locale: string;
}

/** Mesmas opções do app Android (CurrencyConfig.kt) — manter em sincronia. */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷', label: 'Real Brasileiro', locale: 'pt-BR' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', label: 'Euro', locale: 'pt-PT' },
  { code: 'USD', symbol: '$', flag: '🇺🇸', label: 'Dólar Americano', locale: 'en-US' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', label: 'Libra Esterlina', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵', label: 'Iene Japonês', locale: 'ja-JP' },
  { code: 'AOA', symbol: 'Kz', flag: '🇦🇴', label: 'Kwanza Angolano', locale: 'pt-AO' },
  { code: 'MZN', symbol: 'MT', flag: '🇲🇿', label: 'Metical Moçambicano', locale: 'pt-MZ' },
  { code: 'CHF', symbol: 'CHF', flag: '🇨🇭', label: 'Franco Suíço', locale: 'de-CH' },
];

export function currencyOption(code?: string | null): CurrencyOption {
  return CURRENCY_OPTIONS.find((c) => c.code === code) ?? CURRENCY_OPTIONS[0];
}

/** Taxas com base EUR (rates[EUR] = 1), vindas de GET /currency/rates. */
export type ExchangeRates = Record<string, number>;

/**
 * Converte um valor entre moedas via taxa cruzada com base EUR, à taxa de HOJE.
 * Sem taxas ou sem cobertura da moeda → retorna o valor original (melhor esforço).
 *
 * ⚠️ **Só para valores que ainda não aconteceram** — o compromisso mensal de uma
 * recorrente, uma conta por pagar, uma projeção. Aí a taxa de hoje é a resposta
 * certa: é o que a coisa vai custar.
 *
 * **Nunca para histórico.** Um lançamento já feito converte-se à taxa do dia em
 * que foi feito, e isso vive no servidor: use o `convertedAmount` que vem em
 * cada linha de `GET /finance`. Aplicar a taxa de hoje ao passado era o que
 * fazia as despesas de julho/2026 valerem 925,19 € num dia e 898,02 € noutro,
 * sem ninguém ter lançado nada.
 */
export function convertAmount(
  amount: number,
  from: string | null | undefined,
  to: string | null | undefined,
  rates: ExchangeRates | null | undefined,
): number {
  if (!rates || !from || !to || from === to) return amount;
  const rFrom = rates[from];
  const rTo = rates[to];
  if (!rFrom || !rTo) return amount;
  return amount * (rTo / rFrom);
}

/**
 * Moedas da lista que NÃO dá para converter para `to` com as taxas em mão.
 * Vazio = pode somar à vontade.
 *
 * Existe porque `convertAmount` devolve o valor original quando falta a taxa
 * ("melhor esforço"): sem esta verificação, um total mistura reais e euros
 * como se fossem a mesma moeda. Medido em produção com uma conta do casal:
 * 5.345,29 € apresentados onde o valor real era 919,10 €. Quem soma valores
 * de várias moedas deve chamar isto ANTES e recusar-se a mostrar o total
 * quando vier algo.
 */
export function unconvertibleCurrencies(
  currencies: (string | null | undefined)[],
  to: string | null | undefined,
  rates: ExchangeRates | null | undefined,
): string[] {
  if (!to) return [];
  const faltam = new Set<string>();
  for (const raw of currencies) {
    const from: string = raw || to;
    if (from === to) continue;
    if (!rates || !rates[from] || !rates[to]) faltam.add(from);
  }
  return [...faltam];
}

/** Formata um valor NA MOEDA ORIGINAL — nunca assumir R$ fixo. */
export function formatMoney(amount: number, currency?: string | null): string {
  const opt = currencyOption(currency);
  try {
    return new Intl.NumberFormat(opt.locale, {
      style: 'currency',
      currency: opt.code,
    }).format(amount);
  } catch {
    return `${opt.symbol} ${amount.toFixed(2)}`;
  }
}
