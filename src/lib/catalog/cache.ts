import type { SupabaseClient } from "@supabase/supabase-js";

import type { CJProduct } from "@/lib/cj/types";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import type { Database } from "@/types/database";

import type { CatalogProduct } from "./types";

const CACHE_TTL_MINUTES = 60;
const GBP_CURRENCY = "GBP";
const USD_TO_GBP_RATE = 0.79; // approximate mid-market rate, adjust as needed
const RETAIL_MARKUP_MULTIPLIER = 1.2; // 20% markup for profitability

function normalisePrice(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function calculateRetailPrice(product: CJProduct): {
  price: number;
  currency: string;
  currency_code: string;
} {
  const basePrice = normalisePrice(product.price);
  const originCurrency = (product.currency ?? "USD").toUpperCase();

  let gbpPrice = basePrice;
  if (originCurrency === "USD") {
    gbpPrice = basePrice * USD_TO_GBP_RATE;
  } else if (originCurrency !== GBP_CURRENCY) {
    // If we encounter an unexpected currency, leave as-is for now.
    gbpPrice = basePrice;
  }

  const markedUp = gbpPrice * RETAIL_MARKUP_MULTIPLIER;
  const retail = Number(markedUp.toFixed(2));

  return {
    price: retail,
    currency: GBP_CURRENCY,
    currency_code: GBP_CURRENCY,
  };
}

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export type SelectedProductRow = Pick<
  ProductRow,
  | "event_id"
  | "cj_product_id"
  | "title"
  | "price"
  | "currency_code"
  | "inventory_quantity"
  | "estimated_delivery_min_days"
  | "estimated_delivery_max_days"
  | "shipping_policy"
  | "returns_policy"
  | "media"
  | "product_metadata"
  | "tags"
  | "media"
  | "last_synced_at"
>;

type FetchCachedCatalogResult = {
  products: CatalogProduct[];
  total: number;
  fresh: boolean;
};

export function rowToCatalogProduct(row: SelectedProductRow): CatalogProduct {
  const media = (row.media as { images?: string[] } | null) ?? null;
  const metadata = (row.product_metadata as Record<string, unknown> | null) ?? null;
  const originCurrency = (row.currency_code ?? GBP_CURRENCY).toUpperCase();
  const basePrice = normalisePrice(row.price);

  let price = basePrice;
  if (originCurrency !== GBP_CURRENCY) {
    let converted = basePrice;
    if (originCurrency === "USD") {
      converted = basePrice * USD_TO_GBP_RATE;
    }
    price = Number((converted * RETAIL_MARKUP_MULTIPLIER).toFixed(2));
  }

  return {
    eventId: row.event_id ?? undefined,
    id: row.cj_product_id,
    title: row.title,
    price,
    currency: GBP_CURRENCY,
    inventory: row.inventory_quantity ?? undefined,
    estimatedDeliveryMinDays: row.estimated_delivery_min_days ?? undefined,
    estimatedDeliveryMaxDays: row.estimated_delivery_max_days ?? undefined,
    shippingPolicy: row.shipping_policy ?? undefined,
    returnsPolicy: row.returns_policy ?? undefined,
    images: Array.isArray(media?.images) ? media?.images ?? [] : [],
    tags: row.tags ?? undefined,
    description: (metadata?.description as string | undefined) ?? undefined,
  };
}

export function mapCJProductToCatalogProduct(
  product: CJProduct,
  context: { eventId?: string; eventSlug?: string } = {},
): CatalogProduct {
  const { price, currency } = calculateRetailPrice(product);

  return {
    id: product.id,
    title: product.title,
    price,
    currency,
    eventId: context.eventId,
    eventSlug: context.eventSlug,
    inventory: product.inventory,
    estimatedDeliveryMinDays: product.estimatedDeliveryMinDays,
    estimatedDeliveryMaxDays: product.estimatedDeliveryMaxDays,
    shippingPolicy: product.shippingPolicy,
    returnsPolicy: product.returnsPolicy,
    images: product.images,
    tags: product.tags,
    description: product.description,
  };
}

export async function fetchCachedCatalog(
  supabase: SupabaseClient<Database>,
  eventId: string,
  limit: number,
  offset: number,
  ttlMinutes = CACHE_TTL_MINUTES,
): Promise<FetchCachedCatalogResult> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "event_id, cj_product_id, title, price, currency_code, inventory_quantity, estimated_delivery_min_days, estimated_delivery_max_days, shipping_policy, returns_policy, media, product_metadata, tags, last_synced_at",
    )
    .eq("event_id", eventId)
    .order("last_synced_at", { ascending: false })
    .returns<SelectedProductRow[]>();

  if (error) {
    console.error("Failed to query cached products", error);
    return { products: [], total: 0, fresh: false };
  }

  if (!data?.length) {
    return { products: [], total: 0, fresh: false };
  }

  const threshold = Date.now() - ttlMinutes * 60 * 1000;
  const mostRecent = data[0]?.last_synced_at
    ? new Date(data[0].last_synced_at).getTime()
    : 0;
  const fresh = mostRecent >= threshold;

  const catalogProducts = data.map(rowToCatalogProduct);
  const paginated = catalogProducts.slice(offset, offset + limit);

  return {
    products: paginated,
    total: catalogProducts.length,
    fresh,
  };
}

export async function persistProductsForEvent(
  eventId: string,
  products: CJProduct[],
): Promise<void> {
  if (!products.length) return;

  const serviceClient = getSupabaseServiceClient();
  const rows: ProductInsert[] = products.map((product) => ({
    ...calculateRetailPrice(product),
    event_id: eventId,
    cj_product_id: product.id,
    title: product.title,
    inventory_quantity: product.inventory ?? null,
    estimated_delivery_min_days: product.estimatedDeliveryMinDays ?? null,
    estimated_delivery_max_days: product.estimatedDeliveryMaxDays ?? null,
    shipping_policy: product.shippingPolicy ?? null,
    returns_policy: product.returnsPolicy ?? null,
    product_metadata: (product.raw ?? null) as ProductInsert["product_metadata"],
    media: { images: product.images } as ProductInsert["media"],
    tags: product.tags ?? [],
    is_active: true,
    last_synced_at: new Date().toISOString(),
  }));

  const { error } = await serviceClient
    .from("products")
    .upsert(rows, { onConflict: "cj_product_id" });

  if (error) {
    console.error("Failed to persist CJ products", error);
  }
}
