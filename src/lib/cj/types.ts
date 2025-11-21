export interface CJProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  inventory?: number;
  estimatedDeliveryMinDays?: number;
  estimatedDeliveryMaxDays?: number;
  shippingPolicy?: string;
  returnsPolicy?: string;
  images: string[];
  tags?: string[];
  originCountryCode?: string;
  defaultVariantId?: string;
  shippingCost?: number;
  shippingCurrency?: string;
  shippingMethod?: string;
  shippingEstimatedMinDays?: number;
  shippingEstimatedMaxDays?: number;
  raw: unknown;
}

export interface CJSearchParams {
  keywords: string[];
  limit?: number;
  offset?: number;
  requireUkShipping?: boolean;
  includeLogistics?: boolean;
  destinationCountryCode?: string;
}
