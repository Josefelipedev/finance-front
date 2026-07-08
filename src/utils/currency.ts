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
