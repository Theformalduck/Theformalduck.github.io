// Multi-currency display support.
//
// Checkout is always processed in the store's base currency via Stripe; the
// currencies below power an on-store display switcher so international buyers
// can see approximate prices in their own currency. Rates are static
// approximations relative to USD — update here or wire `rate` to an FX API.

export interface CurrencyDef {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  rate: number;        // units of this currency per 1 USD
  zeroDecimal?: boolean;
}

export const CURRENCIES: Record<string, CurrencyDef> = {
  USD: { code: "USD", symbol: "$",  name: "US Dollar",         locale: "en-US", rate: 1 },
  EUR: { code: "EUR", symbol: "€",  name: "Euro",              locale: "de-DE", rate: 0.92 },
  GBP: { code: "GBP", symbol: "£",  name: "British Pound",     locale: "en-GB", rate: 0.79 },
  CAD: { code: "CAD", symbol: "$",  name: "Canadian Dollar",   locale: "en-CA", rate: 1.36 },
  AUD: { code: "AUD", symbol: "$",  name: "Australian Dollar", locale: "en-AU", rate: 1.52 },
  NZD: { code: "NZD", symbol: "$",  name: "New Zealand Dollar",locale: "en-NZ", rate: 1.64 },
  JPY: { code: "JPY", symbol: "¥",  name: "Japanese Yen",      locale: "ja-JP", rate: 157, zeroDecimal: true },
  INR: { code: "INR", symbol: "₹",  name: "Indian Rupee",      locale: "en-IN", rate: 83 },
  BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real",    locale: "pt-BR", rate: 5.1 },
  MXN: { code: "MXN", symbol: "$",  name: "Mexican Peso",      locale: "es-MX", rate: 17 },
  SGD: { code: "SGD", symbol: "$",  name: "Singapore Dollar",  locale: "en-SG", rate: 1.35 },
  CHF: { code: "CHF", symbol: "Fr", name: "Swiss Franc",       locale: "de-CH", rate: 0.89 },
  SEK: { code: "SEK", symbol: "kr", name: "Swedish Krona",     locale: "sv-SE", rate: 10.5 },
  AED: { code: "AED", symbol: "د.إ",name: "UAE Dirham",        locale: "ar-AE", rate: 3.67 },
  ZAR: { code: "ZAR", symbol: "R",  name: "South African Rand",locale: "en-ZA", rate: 18.5 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES);

export function isCurrency(code: string | null | undefined): code is string {
  return !!code && Object.prototype.hasOwnProperty.call(CURRENCIES, code);
}

export function convertFromUSD(usd: number, code: string): number {
  const def = CURRENCIES[code] ?? CURRENCIES.USD;
  return usd * def.rate;
}

/** Convert a USD amount into `code` and format it for that currency's locale. */
export function formatMoney(usd: number, code = "USD"): string {
  const def = CURRENCIES[code] ?? CURRENCIES.USD;
  const amount = usd * def.rate;
  try {
    return new Intl.NumberFormat(def.locale, {
      style: "currency",
      currency: def.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback if the runtime lacks the locale/currency data.
    return `${def.symbol}${Math.round(amount).toLocaleString()}`;
  }
}
