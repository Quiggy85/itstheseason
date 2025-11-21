import { MARKET_CONFIG } from "@/config/market";

const DEFAULT_DECIMALS = 2;

function toUpper(value?: string | null): string | undefined {
  return value ? value.toUpperCase() : undefined;
}

function convertAmount(
  amount: number,
  sourceCurrency: string | undefined,
  conversions: Record<string, number>,
): number {
  const source = toUpper(sourceCurrency);
  if (!Number.isFinite(amount) || amount === 0) return 0;
  if (!source || source === MARKET_CONFIG.currencyCode) {
    return amount;
  }

  const rate = conversions[source];
  if (!rate) {
    return amount;
  }
  return amount * rate;
}

function applyMarkup(amount: number, multiplier: number): number {
  return Number((amount * multiplier).toFixed(DEFAULT_DECIMALS));
}

export function toRetailPrice(amount: number, sourceCurrency?: string): {
  price: number;
  currency: string;
} {
  const converted = convertAmount(amount, sourceCurrency, MARKET_CONFIG.currencyConversions);
  return {
    price: applyMarkup(converted, MARKET_CONFIG.retailMarkupMultiplier),
    currency: MARKET_CONFIG.currencyCode,
  };
}

export function toRetailCurrencyCode(): string {
  return MARKET_CONFIG.currencyCode;
}

export function toRetailPriceValue(amount: number, sourceCurrency?: string): number {
  return toRetailPrice(amount, sourceCurrency).price;
}

export function toShippingCost(amount: number, sourceCurrency?: string): number {
  const converted = convertAmount(
    amount,
    sourceCurrency,
    MARKET_CONFIG.shipping.quoteCurrencyConversions,
  );
  return applyMarkup(converted, MARKET_CONFIG.shipping.markupMultiplier);
}

export function marketShippingCurrency(): string {
  return MARKET_CONFIG.currencyCode;
}

export function formatMarketCurrency(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(MARKET_CONFIG.locale, {
    style: "currency",
    currency: MARKET_CONFIG.currencyCode,
    maximumFractionDigits: DEFAULT_DECIMALS,
    ...options,
  }).format(value);
}

export function getMarketConfig() {
  return MARKET_CONFIG;
}
