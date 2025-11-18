import { searchCJProducts } from "@/lib/cj/service";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { fetchCachedCatalog, persistProductsForEvent, mapCJProductToCatalogProduct } from "@/lib/catalog/cache";

import type { CatalogResponse } from "./types";

export interface FetchCatalogOptions {
  limit?: number;
  offset?: number;
  requireUkShipping?: boolean;
}

export interface FetchCatalogResult {
  data?: CatalogResponse;
  error?: {
    status: number;
    message: string;
  };
}

export async function fetchCatalogBySlug(
  slug: string,
  { limit = 20, offset = 0, requireUkShipping = true }: FetchCatalogOptions = {},
): Promise<FetchCatalogResult> {
  if (!slug) {
    return { error: { status: 400, message: "Missing seasonal event." } };
  }

  const supabase = await getSupabaseServerClient();

  const { data: event, error: eventError } = await supabase
    .from("seasonal_events")
    .select("id, name, slug, description, start_date, end_date")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    return { error: { status: 404, message: "Seasonal event not found." } };
  }

  const { data: keywordsRows, error: keywordsError } = await supabase
    .from("seasonal_event_keywords")
    .select("keyword")
    .eq("event_id", event.id);

  if (keywordsError) {
    return { error: { status: 500, message: "Failed to load seasonal keywords." } };
  }

  const keywords = (keywordsRows ?? []).map((row) => row.keyword).filter(Boolean);

  if (keywords.length === 0) {
    return {
      error: { status: 422, message: "Seasonal event has no keyword filters configured." },
    };
  }

  const cached = await fetchCachedCatalog(supabase, event.id, limit, offset);
  if (cached.products.length && cached.fresh) {
    return {
      data: {
        event,
        products: cached.products,
        pagination: {
          limit,
          offset,
        },
      },
    };
  }

  try {
    const products = await searchCJProducts({
      keywords,
      limit,
      offset,
      requireUkShipping,
    });

    await persistProductsForEvent(event.id, products);

    const mappedProducts = products.map(mapCJProductToCatalogProduct);

    return {
      data: {
        event,
        products: mappedProducts,
        pagination: {
          limit,
          offset,
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch CJ products", error);

    if (cached.products.length) {
      return {
        data: {
          event,
          products: cached.products,
          pagination: {
            limit,
            offset,
          },
        },
      };
    }

    return { error: { status: 502, message: "Unable to load products." } };
  }
}
