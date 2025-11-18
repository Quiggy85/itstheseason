import { getMemoryCache } from "@/lib/cj/cache";
import { cjFetch } from "@/lib/cj/client";
import { getRateLimitedQueue } from "@/lib/cj/rate-limiter";

import type { CJProduct, CJSearchParams } from "./types";

type CJSearchResponse = {
  data: Array<{
    product_id: string;
    product_title: string;
    sell_price: number;
    currency: string;
    inventory?: number;
    shipping_time?: string;
    shipping_policy?: string;
    return_policy?: string;
    product_images?: string[];
    tags?: string[];
    description?: string;
  }>;
};

const cache = getMemoryCache();
const queue = getRateLimitedQueue();

function parseShippingEstimate(shippingTime?: string) {
  if (!shippingTime) return { min: undefined, max: undefined };

  const match = shippingTime.match(/(\d+)-(\d+)/);
  if (!match) return { min: undefined, max: undefined };

  return { min: Number.parseInt(match[1], 10), max: Number.parseInt(match[2], 10) };
}

function mapProduct(raw: CJSearchResponse["data"][number]): CJProduct {
  const estimate = parseShippingEstimate(raw.shipping_time);
  return {
    id: raw.product_id,
    title: raw.product_title,
    price: raw.sell_price,
    currency: raw.currency,
    inventory: raw.inventory,
    estimatedDeliveryMinDays: estimate.min,
    estimatedDeliveryMaxDays: estimate.max,
    shippingPolicy: raw.shipping_policy,
    returnsPolicy: raw.return_policy,
    images: raw.product_images ?? [],
    tags: raw.tags,
    description: raw.description,
    raw,
  };
}

function filterForUkShipping(products: CJProduct[], requireUkShipping: boolean): CJProduct[] {
  if (!requireUkShipping) return products;
  // Placeholder filtering: retain products that either explicitly mention UK delivery
  // in their tags or shipping policy. This should be refined once CJ API shipping
  // metadata is confirmed.
  return products.filter((product) => {
    const tagsContainUk = product.tags?.some((tag) => /uk|united kingdom/i.test(tag)) ?? false;
    const policyMentionsUk = product.shippingPolicy
      ? /uk|united kingdom/i.test(product.shippingPolicy)
      : false;
    return tagsContainUk || policyMentionsUk;
  });
}

function buildCacheKey(params: CJSearchParams) {
  const { keywords, limit = 20, offset = 0, requireUkShipping = true } = params;
  return ["search", keywords.sort().join("-"), limit, offset, requireUkShipping].join(":");
}

export async function searchCJProducts(params: CJSearchParams): Promise<CJProduct[]> {
  const cacheKey = buildCacheKey(params);
  const cached = cache.get<CJProduct[]>(cacheKey);
  if (cached) return cached;

  const result = await queue.enqueue(async () => {
    // TODO: adjust endpoint & payload per CJ API docs.
    const response = await cjFetch<CJSearchResponse>(
      `/products/search?keywords=${encodeURIComponent(params.keywords.join(","))}`,
      {
        method: "GET",
      },
    );
    return response;
  });

  const mappedProducts = result.data.map(mapProduct);
  const filteredProducts = filterForUkShipping(mappedProducts, params.requireUkShipping ?? true);
  cache.set(cacheKey, filteredProducts, 2 * 60 * 1000);
  return filteredProducts;
}
