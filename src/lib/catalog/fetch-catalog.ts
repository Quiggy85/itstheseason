import { searchCJProducts } from "@/lib/cj/service";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { fetchCachedCatalog, persistProductsForEvent, mapCJProductToCatalogProduct } from "@/lib/catalog/cache";
import { getSeasonalEventBySlug } from "@/config/seasonal-events";

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

  const seasonalConfig = getSeasonalEventBySlug(slug);

  if (eventError || !event) {
    if (!seasonalConfig) {
      return { error: { status: 404, message: "Seasonal event not found." } };
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const startDate = new Date(Date.UTC(year, seasonalConfig.startMonth - 1, seasonalConfig.startDay));
    const endDate = new Date(Date.UTC(year, seasonalConfig.endMonth - 1, seasonalConfig.endDay));

    return await fetchCatalogWithoutPersistence({
      limit,
      offset,
      requireUkShipping,
      fallbackEvent: {
        id: slug,
        name: seasonalConfig.name,
        slug: seasonalConfig.slug,
        description: seasonalConfig.hero.subheadline,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
      keywords: seasonalConfig.keywords,
      eventSlug: seasonalConfig.slug,
    });
  }

  const { data: keywordsRows, error: keywordsError } = await supabase
    .from("seasonal_event_keywords")
    .select("keyword")
    .eq("event_id", event.id);

  if (keywordsError) {
    return { error: { status: 500, message: "Failed to load seasonal keywords." } };
  }

  let keywords = (keywordsRows ?? []).map((row) => row.keyword).filter(Boolean);

  if (keywords.length === 0 && seasonalConfig?.keywords?.length) {
    keywords = seasonalConfig.keywords;
  }

  if (keywords.length === 0) {
    return {
      error: { status: 422, message: "Seasonal event has no keyword filters configured." },
    };
  }

  const cached = await fetchCachedCatalog(supabase, event.id, limit, offset);
  if (cached.products.length && cached.fresh) {
    const enrichedCachedProducts = cached.products.map((product) => ({
      ...product,
      eventId: product.eventId ?? event.id,
      eventSlug: product.eventSlug ?? event.slug,
    }));
    return {
      data: {
        event,
        products: enrichedCachedProducts,
        pagination: {
          limit,
          offset,
          total: cached.total,
          hasMore: offset + limit < cached.total,
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
      includeLogistics: true,
      destinationCountryCode: "GB",
    });

    await persistProductsForEvent(event.id, products);

    const mappedProducts = products.map((product) =>
      mapCJProductToCatalogProduct(product, { eventId: event.id, eventSlug: event.slug }),
    );
    const hasMore = products.length === limit;
    const total = cached.total && cached.total > offset
      ? Math.max(cached.total, offset + mappedProducts.length)
      : hasMore
        ? undefined
        : offset + mappedProducts.length;

    return {
      data: {
        event,
        products: mappedProducts,
        pagination: {
          limit,
          offset,
          total,
          hasMore,
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch CJ products", error);

    if (cached.products.length) {
      const enrichedCachedProducts = cached.products.map((product) => ({
        ...product,
        eventId: product.eventId ?? event.id,
        eventSlug: product.eventSlug ?? event.slug,
      }));
      return {
        data: {
          event,
          products: enrichedCachedProducts,
          pagination: {
            limit,
            offset,
            total: cached.total,
            hasMore: offset + limit < cached.total,
          },
        },
      };
    }

    return { error: { status: 502, message: "Unable to load products." } };
  }
}

interface FallbackCatalogOptions {
  limit: number;
  offset: number;
  requireUkShipping: boolean;
  fallbackEvent: CatalogResponse["event"];
  keywords: string[];
  eventSlug: string;
}

async function fetchCatalogWithoutPersistence({
  limit,
  offset,
  requireUkShipping,
  fallbackEvent,
  keywords,
  eventSlug,
}: FallbackCatalogOptions): Promise<FetchCatalogResult> {
  try {
    const products = await searchCJProducts({
      keywords,
      limit,
      offset,
      requireUkShipping,
    });

    const mappedProducts = products.map((product) =>
      mapCJProductToCatalogProduct(product, { eventSlug }),
    );
    const hasMore = products.length === limit;

    return {
      data: {
        event: fallbackEvent,
        products: mappedProducts,
        pagination: {
          limit,
          offset,
          total: mappedProducts.length,
          hasMore,
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch CJ products (fallback)", error);
    return { error: { status: 502, message: "Unable to load products." } };
  }
}
