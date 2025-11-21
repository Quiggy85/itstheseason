export type MarketConfig = {
  /** IETF locale tag used for currency/date formatting. */
  locale: string;
  /** ISO currency code used for retail pricing. */
  currencyCode: string;
  /** Multiplier applied to converted supplier pricing. */
  retailMarkupMultiplier: number;
  /**
   * Conversion multipliers from supplier currency -> target currency.
   * Values represent how many target currency units equal one unit of the source.
   */
  currencyConversions: Record<string, number>;
  shipping: {
    destinationCountryCode: string;
    /** If true, we discard products that cannot confirm logistics to the destination. */
    requireDestinationMatch: boolean;
    /** Fallback messaging when custom shipping copy is unavailable. */
    fallbackTagline: string;
    /** Signals used when heuristically inferring shipping support from tags/policies. */
    destinationKeywords: string[];
    quoteCurrency: string;
    /** Conversion multipliers for logistics quotes -> display currency. */
    quoteCurrencyConversions: Record<string, number>;
    markupMultiplier: number;
  };
};

export const MARKET_CONFIG: MarketConfig = {
  locale: "en-US",
  currencyCode: "USD",
  retailMarkupMultiplier: 1.2,
  currencyConversions: {
    USD: 1,
    GBP: 1.24,
    EUR: 1.08,
    CAD: 0.73,
  },
  shipping: {
    destinationCountryCode: "US",
    requireDestinationMatch: true,
    fallbackTagline: "Fast US delivery",
    destinationKeywords: [
      "US",
      "USA",
      "United States",
      "United States of America",
      "U.S.",
      "Ships from USA",
    ],
    quoteCurrency: "USD",
    quoteCurrencyConversions: {
      USD: 1,
      GBP: 1.24,
      EUR: 1.08,
    },
    markupMultiplier: 1.2,
  },
};
