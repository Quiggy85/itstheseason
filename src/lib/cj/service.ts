import { getMemoryCache } from "@/lib/cj/cache";
import { cjFetch } from "@/lib/cj/client";
import { getRateLimitedQueue } from "@/lib/cj/rate-limiter";

import type { CJProduct, CJSearchParams } from "./types";

type CJSearchResponse = {
  data?: {
    pageSize?: number;
    pageNumber?: number;
    totalRecords?: number;
    totalPages?: number;
    content?: CJProductListGroup[];
  };
};

type CJProductListGroup = {
  productList?: CJProductListItem[];
  storeList?: CJStoreInfo[];
};

type CJProductListItem = {
  id: string;
  nameEn?: string;
  productSku?: string;
  bigImage?: string;
  sellPrice?: number | string;
  nowPrice?: number | string;
  currency?: string;
  description?: string;
  deliveryCycle?: string;
  warehouseInventoryNum?: number;
  totalVerifiedInventory?: number;
  totalUnVerifiedInventory?: number;
  listedNum?: number;
  oneCategoryName?: string;
  twoCategoryName?: string;
  threeCategoryName?: string;
};

type CJStoreInfo = {
  warehouseId?: string;
  warehouseName?: string;
  countryCode?: string;
};

const cache = getMemoryCache();
const queue = getRateLimitedQueue();

function coerceNumber(value?: number | string | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDeliveryEstimate(deliveryCycle?: string) {
  if (!deliveryCycle) return { min: undefined, max: undefined };

  const match = deliveryCycle.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return { min: undefined, max: undefined };

  return { min: Number.parseInt(match[1], 10), max: Number.parseInt(match[2], 10) };
}

function mapProduct(raw: CJProductListItem, stores: CJStoreInfo[] = []): CJProduct {
  const estimate = parseDeliveryEstimate(raw.deliveryCycle);
  const price = coerceNumber(raw.nowPrice) ?? coerceNumber(raw.sellPrice) ?? 0;
  const inventory =
    raw.totalVerifiedInventory ?? raw.warehouseInventoryNum ?? raw.totalUnVerifiedInventory;
  const tags = [raw.oneCategoryName, raw.twoCategoryName, raw.threeCategoryName].filter(
    (value): value is string => Boolean(value && value.length),
  );
  const storeCountries = stores
    .map((store) => store.countryCode?.toUpperCase())
    .filter((code): code is string => Boolean(code));

  return {
    id: raw.id,
    title: raw.nameEn ?? raw.productSku ?? "CJ Product",
    price,
    currency: raw.currency ?? "USD",
    inventory: inventory ?? undefined,
    estimatedDeliveryMinDays: estimate.min,
    estimatedDeliveryMaxDays: estimate.max,
    shippingPolicy: undefined,
    returnsPolicy: undefined,
    images: raw.bigImage ? [raw.bigImage] : [],
    tags: tags.length ? tags : undefined,
    description: raw.description,
    raw: { product: raw, storeCountries },
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
    const rawStoreCountries = Array.isArray((product.raw as { storeCountries?: string[] })?.storeCountries)
      ? ((product.raw as { storeCountries?: string[] }).storeCountries ?? [])
      : [];
    const storeSupportsUk = rawStoreCountries.some((code) => code === "GB" || code === "UK");
    return tagsContainUk || policyMentionsUk || storeSupportsUk;
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

  const { keywords, requireUkShipping = true } = params;
  const requestedLimit = params.limit && params.limit > 0 ? params.limit : 20;
  const size = Math.min(Math.max(requestedLimit, 1), 100);
  const offset = params.offset ?? 0;
  const page = Math.floor(offset / size) + 1;
  const keywordQuery = keywords.join(" ").trim();

  const result = await queue.enqueue(async () => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (keywordQuery) {
      searchParams.set("keyWord", keywordQuery);
    }

    const response = await cjFetch<CJSearchResponse>(
      `/v1/product/listV2?${searchParams.toString()}`,
      {
        method: "GET",
      },
    );
    return response;
  });

  const groups = result.data?.content ?? [];
  const mappedProducts = groups.flatMap((group) => {
    const stores = group.storeList ?? [];
    return (group.productList ?? []).map((product) => mapProduct(product, stores));
  });

  const limitedProducts = mappedProducts.slice(0, size);
  const filteredProducts = filterForUkShipping(limitedProducts, requireUkShipping);
  cache.set(cacheKey, filteredProducts, 2 * 60 * 1000);
  return filteredProducts;
}
