export interface CatalogProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  inventory?: number;
  estimatedDeliveryMinDays?: number;
  estimatedDeliveryMaxDays?: number;
  shippingPolicy?: string;
  returnsPolicy?: string;
  images: string[];
  tags?: string[];
  description?: string;
}

export interface CatalogEvent {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  start_date: string;
  end_date: string;
}

export interface CatalogResponse {
  event: CatalogEvent;
  products: CatalogProduct[];
  pagination: {
    limit: number;
    offset: number;
  };
}
