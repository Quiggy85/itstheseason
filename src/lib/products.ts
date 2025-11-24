import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCurrentSeason } from "@/lib/seasons";
import {
  getProductsBySkus,
  getShippingOptionsBySku,
  type AvasamProduct,
  type AvasamShippingOption,
} from "@/lib/avasam";

const MARKUP_PERCENT = Number(process.env.PRICE_MARKUP_PERCENT ?? 20);
const SHIPPING_REFRESH_HOURS = Number(
  process.env.AVASAM_SHIPPING_REFRESH_HOURS ?? 6,
);
const SHIPPING_REFRESH_MS = Number.isFinite(SHIPPING_REFRESH_HOURS)
  ? Math.max(SHIPPING_REFRESH_HOURS, 1) * 60 * 60 * 1000
  : 6 * 60 * 60 * 1000;

type ProductShippingRow = {
  product_id: string | null;
  avasam_sku: string;
  service_id: number | null;
  service_name: string | null;
  warehouse_id: number | null;
  warehouse_name: string | null;
  shipping_cost: number | null;
  shipping_cost_inc_vat: number | null;
  currency: string | null;
  dispatch_days: number | null;
  delivery_min_days: number | null;
  delivery_max_days: number | null;
  raw: Record<string, unknown> | null;
  last_synced_at: string | null;
};

export type ProductShipping = {
  service_id: number | null;
  service_name: string | null;
  warehouse_id: number | null;
  warehouse_name: string | null;
  shipping_cost: number | null;
  shipping_cost_inc_vat: number | null;
  currency: string | null;
  dispatch_days: number | null;
  delivery_min_days: number | null;
  delivery_max_days: number | null;
  last_synced_at: string | null;
};

function mapShippingRowToInfo(row: ProductShippingRow): ProductShipping {
  return {
    service_id: row.service_id ?? null,
    service_name: row.service_name ?? null,
    warehouse_id: row.warehouse_id ?? null,
    warehouse_name: row.warehouse_name ?? null,
    shipping_cost: row.shipping_cost ?? null,
    shipping_cost_inc_vat: row.shipping_cost_inc_vat ?? null,
    currency: row.currency ?? null,
    dispatch_days: row.dispatch_days ?? null,
    delivery_min_days: row.delivery_min_days ?? null,
    delivery_max_days: row.delivery_max_days ?? null,
    last_synced_at: row.last_synced_at ?? null,
  };
}

function shouldRefreshShipping(row: ProductShippingRow | undefined): boolean {
  if (!row) return true;
  if (!row.last_synced_at) return true;

  const parsed = Date.parse(row.last_synced_at);
  if (Number.isNaN(parsed)) return true;

  return Date.now() - parsed > SHIPPING_REFRESH_MS;
}

function selectPreferredShippingOption(
  options: AvasamShippingOption[],
): AvasamShippingOption | null {
  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }

  const sorted = options.slice().sort((a, b) => {
    const aCost =
      a.shippingCostIncVat ?? a.shippingCost ?? Number.POSITIVE_INFINITY;
    const bCost =
      b.shippingCostIncVat ?? b.shippingCost ?? Number.POSITIVE_INFINITY;

    if (aCost !== bCost) {
      return aCost - bCost;
    }

    const aDelivery = a.deliveryMaxDays ?? a.deliveryMinDays ?? Infinity;
    const bDelivery = b.deliveryMaxDays ?? b.deliveryMinDays ?? Infinity;

    if (aDelivery !== bDelivery) {
      return aDelivery - bDelivery;
    }

    const aDispatch = a.dispatchDays ?? Infinity;
    const bDispatch = b.dispatchDays ?? Infinity;

    return aDispatch - bDispatch;
  });

  return sorted[0] ?? null;
}

export type SeasonalProduct = {
  id: string;
  avasam_sku: string;
  name: string;
  description: string | null;
  image_url: string | null;
  retail_price: number | null;
  currency: string | null;
  price_with_markup: number | null;
  avasam: AvasamProduct | null;
  shipping: ProductShipping | null;
};

export async function getProductsForCurrentSeason(): Promise<{
  season: Awaited<ReturnType<typeof getCurrentSeason>>;
  products: SeasonalProduct[];
}> {
  const supabase = createSupabaseServerClient();
  const season = await getCurrentSeason();

  if (!season) {
    return { season: null, products: [] };
  }

  const { data: joined, error } = await supabase
    .from("product_seasons")
    .select("products:products(id, avasam_sku, name, description, image_url, retail_price, currency)")
    .eq("season_id", season.id);

  if (error) {
    console.error("Error fetching products for season", error.message);
    return { season, products: [] };
  }

  const flatProducts = (joined ?? [])
    .map((row: any) => row.products)
    .filter(Boolean) as {
    id: string;
    avasam_sku: string;
    name: string;
    description: string | null;
    image_url: string | null;
    retail_price: number | null;
    currency: string | null;
  }[];

  const skus = flatProducts.map((p) => p.avasam_sku).filter(Boolean);

  let shippingRows: ProductShippingRow[] = [];

  if (skus.length > 0) {
    const { data: existingShipping, error: shippingError } = await supabase
      .from("product_shipping")
      .select(
        "product_id, avasam_sku, service_id, service_name, warehouse_id, warehouse_name, shipping_cost, shipping_cost_inc_vat, currency, dispatch_days, delivery_min_days, delivery_max_days, raw, last_synced_at",
      )
      .in("avasam_sku", skus);

    if (shippingError) {
      console.error(
        "Error fetching shipping for season products",
        shippingError.message,
      );
    } else if (Array.isArray(existingShipping)) {
      shippingRows = existingShipping as ProductShippingRow[];
    }
  }

  const shippingBySku = new Map<string, ProductShippingRow>();
  shippingRows.forEach((row) => {
    if (row?.avasam_sku) {
      shippingBySku.set(row.avasam_sku, row);
    }
  });

  const productIdBySku = new Map(
    flatProducts
      .filter((p) => p.avasam_sku)
      .map((p) => [p.avasam_sku, p.id] as const),
  );

  const staleSkus = flatProducts
    .filter((p) => p.avasam_sku)
    .map((p) => p.avasam_sku)
    .filter((sku) => shouldRefreshShipping(shippingBySku.get(sku)));

  if (staleSkus.length > 0) {
    const upserts = (
      await Promise.all(
        staleSkus.map(async (sku) => {
          try {
            const options = await getShippingOptionsBySku(sku);
            const best = selectPreferredShippingOption(options);

            if (!best) {
              return null;
            }

            return {
              product_id: productIdBySku.get(sku) ?? null,
              avasam_sku: sku,
              service_id: best.serviceId ?? null,
              service_name: best.serviceName ?? null,
              warehouse_id: best.warehouseId ?? null,
              warehouse_name: best.warehouseName ?? null,
              shipping_cost: best.shippingCost ?? null,
              shipping_cost_inc_vat: best.shippingCostIncVat ?? null,
              currency: best.currency ?? null,
              dispatch_days: best.dispatchDays ?? null,
              delivery_min_days: best.deliveryMinDays ?? null,
              delivery_max_days: best.deliveryMaxDays ?? null,
              raw: best.raw ?? null,
              last_synced_at: new Date().toISOString(),
            } satisfies ProductShippingRow;
          } catch (error) {
            console.error("Error fetching Avasam shipping for", sku, error);
            return null;
          }
        }),
      )
    ).filter(Boolean) as ProductShippingRow[];

    if (upserts.length > 0) {
      const { error: upsertError } = await supabase
        .from("product_shipping")
        .upsert(upserts, { onConflict: "avasam_sku" });

      if (upsertError) {
        console.error(
          "Error upserting product shipping",
          upsertError.message,
        );
      } else {
        upserts.forEach((row) => {
          shippingBySku.set(row.avasam_sku, row);
        });
      }
    }
  }

  const avasamProducts = await getProductsBySkus(skus);
  const avasamBySku = new Map(avasamProducts.map((p) => [p.SKU, p]));

  const products: SeasonalProduct[] = flatProducts.map((p) => {
    const avasam = avasamBySku.get(p.avasam_sku) ?? null;
    const shippingRow = p.avasam_sku
      ? shippingBySku.get(p.avasam_sku)
      : undefined;
    const shipping = shippingRow ? mapShippingRowToInfo(shippingRow) : null;
    // Prefer VAT-inclusive cost from Avasam; fall back sensibly
    let basePrice: number | null = null;

    if (avasam) {
      const vatPct =
        avasam.VATPercentage ??
        (typeof avasam.Vat === "number" ? avasam.Vat : undefined);

      if (typeof avasam.PriceIncVat === "number") {
        basePrice = avasam.PriceIncVat;
      } else if (vatPct != null && typeof avasam.Price === "number") {
        basePrice = avasam.Price * (1 + vatPct / 100);
      } else if (typeof avasam.Price === "number") {
        basePrice = avasam.Price;
      }
    }

    if (basePrice == null && p.retail_price != null) {
      basePrice = p.retail_price;
    }

    const priceWithMarkup =
      basePrice != null
        ? Math.round(basePrice * (1 + MARKUP_PERCENT / 100) * 100) / 100
        : null;

    return {
      ...p,
      price_with_markup: priceWithMarkup,
      avasam,
      shipping,
    };
  });

  return { season, products };
}
