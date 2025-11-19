import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CatalogEvent, CatalogProduct } from "@/lib/catalog/types";
import { rowToCatalogProduct, type SelectedProductRow } from "@/lib/catalog/cache";

export interface FetchProductResult {
  data?: {
    product: CatalogProduct;
    event?: CatalogEvent | null;
  };
  error?: {
    status: number;
    message: string;
  };
}

const productSelection =
  "event_id, cj_product_id, title, price, currency_code, inventory_quantity, estimated_delivery_min_days, estimated_delivery_max_days, shipping_policy, returns_policy, media, product_metadata, tags, last_synced_at";

export async function fetchProductById(productId: string): Promise<FetchProductResult> {
  if (!productId) {
    return { error: { status: 400, message: "Missing product identifier." } };
  }

  const supabase = await getSupabaseServerClient();

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select(productSelection)
    .eq("cj_product_id", productId)
    .maybeSingle<SelectedProductRow>();

  if (productError) {
    console.error("Failed to fetch product from cache", productError);
    return { error: { status: 500, message: "Unable to load product." } };
  }

  if (!productRow) {
    return { error: { status: 404, message: "Product not found." } };
  }

  const product = rowToCatalogProduct(productRow);

  let event: CatalogEvent | null = null;
  if (productRow.event_id) {
    const { data: eventRow, error: eventError } = await supabase
      .from("seasonal_events")
      .select("id, name, slug, description, start_date, end_date")
      .eq("id", productRow.event_id)
      .maybeSingle<CatalogEvent>();

    if (eventError) {
      console.error("Failed to fetch product event", eventError);
    } else {
      event = eventRow;
    }
  }

  return {
    data: {
      product,
      event,
    },
  };
}
