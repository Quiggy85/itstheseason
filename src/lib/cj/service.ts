import { getMemoryCache } from "@/lib/cj/cache";
import { cjFetch } from "@/lib/cj/client";
import { getRateLimitedQueue } from "@/lib/cj/rate-limiter";

import type { CJProduct, CJSearchParams } from "./types";

type FreightCalculateResponse = {
  code: number;
  result: boolean;
  message: string;
  data?: Array<{
    logisticAging?: string;
    logisticPrice?: number | string;
    logisticName?: string;
    option?: {
      enName?: string;
    };
    arrivalTime?: string;
    postage?: number | string;
  }>;
};

const DEFAULT_DESTINATION = "GB";
const SHIPPING_USD_TO_GBP_RATE = 0.79;
const SHIPPING_MARKUP = 1.2;

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
const variantIdCache = new Map<string, string | null>();

function coerceNumber(value?: number | string | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

type CJVariantListResponse = {
  result?: boolean;
  data?:
    | Array<{
        variantList?: Array<Record<string, unknown>>;
        productSkuList?: Array<Record<string, unknown>>;
        skuList?: Array<Record<string, unknown>>;
        variants?: Array<Record<string, unknown>>;
      }>
    | {
        variantList?: Array<Record<string, unknown>>;
        productSkuList?: Array<Record<string, unknown>>;
        skuList?: Array<Record<string, unknown>>;
        variants?: Array<Record<string, unknown>>;
      };
};

type CJProductDetailResponse = {
  result?: boolean;
  data?: {
    productSkuList?: Array<Record<string, unknown>>;
    variants?: Array<Record<string, unknown>>;
    skuList?: Array<Record<string, unknown>>;
  };
};

function pickFirstVariantId(payload: unknown): string | undefined {
  if (!payload) return undefined;
  const containers = Array.isArray(payload) ? payload : [payload];
  for (const container of containers) {
    if (!container || typeof container !== "object") continue;
    const { variantList, productSkuList, skuList, variants } = container as {
      variantList?: Array<Record<string, unknown>>;
      productSkuList?: Array<Record<string, unknown>>;
      skuList?: Array<Record<string, unknown>>;
      variants?: Array<Record<string, unknown>>;
    };
    const candidateLists = [variantList, productSkuList, skuList, variants].filter(
      (value): value is Array<Record<string, unknown>> => Array.isArray(value),
    );
    for (const list of candidateLists) {
      for (const candidate of list) {
        if (!candidate || typeof candidate !== "object") continue;
        const variantId =
          (candidate.vid as string | undefined) ??
          (candidate.variantId as string | undefined) ??
          (candidate.id as string | undefined) ??
          (candidate.skuId as string | undefined) ??
          (candidate.sku as string | undefined);
        if (variantId) {
          return String(variantId);
        }
      }
    }
  }
  return undefined;
}

async function fetchDefaultVariantId(productId: string): Promise<string | undefined> {
  if (variantIdCache.has(productId)) {
    const cached = variantIdCache.get(productId);
    return cached ?? undefined;
  }

  const attemptVariantList = async () => {
    try {
      const response = await queue.enqueue(() =>
        cjFetch<CJVariantListResponse>("/v1/product/variant/list", {
          method: "POST",
          body: JSON.stringify({ productId }),
        }),
      );
      return pickFirstVariantId(response?.data);
    } catch (error) {
      console.warn("CJ variant list fetch failed", { productId, error });
      return undefined;
    }
  };

  const attemptProductDetail = async () => {
    try {
      const response = await queue.enqueue(() =>
        cjFetch<CJProductDetailResponse>(`/v1/product/detail?productId=${productId}`, {
          method: "GET",
        }),
      );
      return pickFirstVariantId(response?.data);
    } catch (error) {
      console.warn("CJ product detail fetch failed", { productId, error });
      return undefined;
    }
  };

  let variantId = await attemptVariantList();
  if (!variantId) {
    variantId = await attemptProductDetail();
  }

  variantIdCache.set(productId, variantId ?? null);
  return variantId ?? undefined;
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
    originCountryCode: storeCountries[0],
    defaultVariantId: (raw as { vid?: string }).vid,
    raw: { product: raw, storeCountries },
  };
}

function parseAgingRange(value?: string): { min?: number; max?: number } {
  if (!value) return {};
  const match = value.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    return { min: Number.parseInt(match[1], 10), max: Number.parseInt(match[2], 10) };
  }
  const single = Number.parseInt(value, 10);
  return Number.isFinite(single) ? { min: single, max: single } : {};
}

function convertShippingPrice(value?: number | string | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  const numeric = Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) return undefined;
  const converted = numeric * SHIPPING_USD_TO_GBP_RATE * SHIPPING_MARKUP;
  return Number(converted.toFixed(2));
}

async function fetchFreightQuote(
  params: {
    variantId: string;
    originCountryCode?: string;
    destinationCountryCode: string;
  },
): Promise<{
  price?: number;
  method?: string;
  minDays?: number;
  maxDays?: number;
} | null> {
  const { variantId, originCountryCode, destinationCountryCode } = params;
  try {
    const response = await queue.enqueue(() =>
      cjFetch<FreightCalculateResponse>("/v1/logistic/freightCalculate", {
        method: "POST",
        body: JSON.stringify({
          startCountryCode: originCountryCode ?? "CN",
          endCountryCode: destinationCountryCode,
          products: [
            {
              quantity: 1,
              vid: variantId,
            },
          ],
        }),
      }),
    );

    if (!response.result || !response.data?.length) {
      return null;
    }

    const option = response.data[0];
    const price =
      convertShippingPrice(option.logisticPrice ?? option.postage) ??
      convertShippingPrice(option.postage);
    const { min, max } = parseAgingRange(option.logisticAging ?? option.arrivalTime);
    const method = option.logisticName ?? option.option?.enName;

    return {
      price,
      method: method ?? undefined,
      minDays: min,
      maxDays: max,
    };
  } catch (error) {
    console.warn("CJ freight calculation failed", {
      variantId,
      error,
    });
    return null;
  }
}

function filterForUkShipping(products: CJProduct[], requireUkShipping: boolean): CJProduct[] {
  if (!requireUkShipping) return products;
  // Placeholder filtering: retain products that either explicitly mention UK delivery
  // in their tags or shipping policy. This should be refined once CJ API shipping
  // metadata is confirmed.
  const filtered = products.filter((product) => {
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

  if (filtered.length) return filtered;

  // If none of the heuristics matched, fall back to the full set so we don't hide
  // potentially eligible products. This can be tightened once CJ exposes explicit
  // destination metadata.
  return products;
}

function buildCacheKey(params: CJSearchParams) {
  const {
    keywords,
    limit = 20,
    offset = 0,
    requireUkShipping = true,
    includeLogistics = false,
    destinationCountryCode = DEFAULT_DESTINATION,
  } = params;
  return [
    "search",
    keywords.slice().sort().join("-"),
    limit,
    offset,
    requireUkShipping,
    includeLogistics,
    destinationCountryCode,
  ].join(":");
}

export async function searchCJProducts(params: CJSearchParams): Promise<CJProduct[]> {
  const cacheKey = buildCacheKey(params);
  const cached = cache.get<CJProduct[]>(cacheKey);
  if (cached) return cached;

  const {
    keywords,
    requireUkShipping = true,
    includeLogistics = false,
    destinationCountryCode = DEFAULT_DESTINATION,
  } = params;
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

  let finalProducts = filteredProducts;

  if (includeLogistics) {
    const eligibleProducts: CJProduct[] = [];

    for (const product of filteredProducts) {
      let variantId = product.defaultVariantId;
      if (!variantId) {
        variantId = await fetchDefaultVariantId(product.id);
      }

      if (!variantId) {
        console.warn("Skipping product without variant for logistics", { productId: product.id });
        continue;
      }

      const quote = await fetchFreightQuote({
        variantId,
        originCountryCode: product.originCountryCode,
        destinationCountryCode,
      });

      if (!quote) {
        console.log("No quote for product", { productId: product.id });
        continue;
      }

      product.defaultVariantId = variantId;
      product.shippingCost = quote.price;
      product.shippingCurrency = quote.price === undefined ? undefined : "GBP";
      product.shippingMethod = quote.method;
      product.shippingEstimatedMinDays = quote.minDays;
      product.shippingEstimatedMaxDays = quote.maxDays;

      eligibleProducts.push(product);
    }

    if (eligibleProducts.length) {
      finalProducts = eligibleProducts;
    } else {
      console.warn("No products with confirmed UK logistics", {
        keywords,
        destinationCountryCode,
      });
      finalProducts = [];
    }
  }

  cache.set(cacheKey, finalProducts, 2 * 60 * 1000);
  return finalProducts;
}
