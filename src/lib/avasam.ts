const AVASAM_BASE_URL =
  process.env.AVASAM_API_BASE_URL ?? "https://app.avasam.com/apiseeker";
const AVASAM_AUTH_URL =
  process.env.AVASAM_API_AUTH_URL ?? "https://app.avasam.com/api/auth";
const AVASAM_CONSUMER_KEY = process.env.AVASAM_API_CONSUMER_KEY;
const AVASAM_CONSUMER_SECRET = process.env.AVASAM_API_CONSUMER_SECRET;
// Optional: if you paste a long-lived token here, it will be used directly
const AVASAM_FIXED_TOKEN = process.env.AVASAM_API_FIXED_TOKEN;

export type AvasamProduct = {
  SKU: string;
  Price: number;
  RetailPrice?: number;
  Vat?: number;
  VATPercentage?: number;
  PriceIncVat?: number;
  RetailPriceIncVat?: number;
  Title: string;
  Description?: string;
  Image?: string;
  ProductImage?: string[];
  Category?: string;
  ProductWeight?: number;
  ProductWidth?: number;
  ProductHeight?: number;
  ProductDepth?: number;
  ExtendedProperties?: { Name: string; Value: string }[];
  Variations?: any[];
  MultiTitle?: { en?: string };
  MultiDescription?: { en?: string };
  CategoryId?: string;
  ProductType?: string;
  VariationType?: string;
};

export type AvasamShippingOption = {
  warehouseId?: number;
  warehouseName?: string;
  serviceId?: number;
  serviceName?: string;
  shippingCost?: number;
  shippingCostIncVat?: number;
  currency?: string;
  dispatchDays?: number;
  deliveryMinDays?: number;
  deliveryMaxDays?: number;
  raw: Record<string, unknown>;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAuthKey(): Promise<string> {
  // If user has configured a fixed token, prefer that
  if (AVASAM_FIXED_TOKEN) {
    console.log("Avasam using fixed token from env");
    return AVASAM_FIXED_TOKEN;
  }

  // Reuse token if it hasn't expired yet
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    console.log("Avasam using cached token");
    return cachedToken.token;
  }

  if (!AVASAM_CONSUMER_KEY || !AVASAM_CONSUMER_SECRET) {
    throw new Error(
      "Avasam consumer credentials are not set. AVASAM_API_CONSUMER_KEY and AVASAM_API_CONSUMER_SECRET are required.",
    );
  }

  const res = await fetch(`${AVASAM_AUTH_URL}/request-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      consumer_key: AVASAM_CONSUMER_KEY,
      secret_key: AVASAM_CONSUMER_SECRET,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "<no body>");
    console.error("Avasam request-token error", res.status, body);
    throw new Error(`Failed to authenticate with Avasam: ${res.status}`);
  }

  const data: { access_token?: string; expires_at?: string } = await res.json();

  if (!data.access_token) {
    throw new Error(
      "Avasam request-token response did not contain access_token. Please verify credentials and API docs.",
    );
  }

  let expiresAt = Date.now() + 5 * 60 * 1000; // fallback 5 minutes
  if (data.expires_at) {
    const parsed = Date.parse(data.expires_at);
    if (!Number.isNaN(parsed)) {
      expiresAt = parsed;
    }
  }

  cachedToken = { token: data.access_token, expiresAt };

  console.log(
    "Avasam obtained new token",
    {
      tokenPreview: data.access_token.slice(0, 8),
      expiresAt: new Date(expiresAt).toISOString(),
    },
  );

  return data.access_token;
}

export async function getProductsBySkus(
  skus: string[],
): Promise<AvasamProduct[]> {
  if (skus.length === 0) return [];

  const authKey = await getAuthKey();

  const res = await fetch(`${AVASAM_BASE_URL}/Products/GetSellerProductList`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Per Avasam docs and Postman test: raw token in Authorization header
      Authorization: authKey,
    },
    body: JSON.stringify({
      Page: 0,
      // Fetch a generous slice of inventory so we can match requested SKUs locally
      Limit: 200,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "<no body>");
    console.error("Avasam GetSellerProductList error", res.status, body);
    return [];
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    console.warn("Unexpected Avasam product list response shape", data);
    return [];
  }

  console.log(
    "Avasam GetSellerProductList returned",
    data.length,
    "items. SKUs:",
    data.map((p: any) => p.SKU),
  );

  const skuSet = new Set(skus);

  return (data as AvasamProduct[]).filter((p) => skuSet.has(p.SKU));
}

function normalizeShippingOption(raw: any): AvasamShippingOption {
  if (!raw || typeof raw !== "object") {
    return { raw: {} };
  }

  const shippingCostIncVatCandidate =
    typeof raw.ShippingCostIncVat === "number"
      ? raw.ShippingCostIncVat
      : typeof raw.TotalShippingPriceIncVat === "number"
        ? raw.TotalShippingPriceIncVat
        : typeof raw.PriceIncVat === "number"
          ? raw.PriceIncVat
          : undefined;

  const shippingCostCandidate =
    typeof raw.ShippingCost === "number"
      ? raw.ShippingCost
      : typeof raw.TotalShippingPrice === "number"
        ? raw.TotalShippingPrice
        : typeof raw.Price === "number"
          ? raw.Price
          : undefined;

  const deliveryMinDaysCandidate =
    typeof raw.DeliveryMinDays === "number"
      ? raw.DeliveryMinDays
      : typeof raw.EstimatedDeliveryMin === "number"
        ? raw.EstimatedDeliveryMin
        : typeof raw.MinDeliveryDays === "number"
          ? raw.MinDeliveryDays
          : undefined;

  const deliveryMaxDaysCandidate =
    typeof raw.DeliveryMaxDays === "number"
      ? raw.DeliveryMaxDays
      : typeof raw.EstimatedDeliveryMax === "number"
        ? raw.EstimatedDeliveryMax
        : typeof raw.MaxDeliveryDays === "number"
          ? raw.MaxDeliveryDays
          : undefined;

  const dispatchDaysCandidate =
    typeof raw.DispatchTime === "number"
      ? raw.DispatchTime
      : typeof raw.DispatchDays === "number"
        ? raw.DispatchDays
        : typeof raw.LeadTime === "number"
          ? raw.LeadTime
          : undefined;

  return {
    warehouseId:
      typeof raw.WarehouseId === "number"
        ? raw.WarehouseId
        : typeof raw.WarehouseID === "number"
          ? raw.WarehouseID
          : undefined,
    warehouseName:
      typeof raw.WarehouseName === "string"
        ? raw.WarehouseName
        : typeof raw.Warehouse === "string"
          ? raw.Warehouse
          : undefined,
    serviceId:
      typeof raw.ShippingServiceId === "number"
        ? raw.ShippingServiceId
        : typeof raw.ShippingServiceID === "number"
          ? raw.ShippingServiceID
          : undefined,
    serviceName:
      typeof raw.ShippingServiceName === "string"
        ? raw.ShippingServiceName
        : typeof raw.ServiceName === "string"
          ? raw.ServiceName
          : typeof raw.Service === "string"
            ? raw.Service
            : undefined,
    shippingCost: shippingCostCandidate,
    shippingCostIncVat: shippingCostIncVatCandidate,
    currency:
      typeof raw.Currency === "string"
        ? raw.Currency
        : typeof raw.CurrencyCode === "string"
          ? raw.CurrencyCode
          : undefined,
    dispatchDays: dispatchDaysCandidate,
    deliveryMinDays: deliveryMinDaysCandidate,
    deliveryMaxDays: deliveryMaxDaysCandidate,
    raw,
  };
}

export async function getShippingOptionsBySku(
  sku: string,
): Promise<AvasamShippingOption[]> {
  if (!sku) return [];

  const authKey = await getAuthKey();

  const res = await fetch(`${AVASAM_BASE_URL}/Products/GetProductWarehouseDetail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authKey,
    },
    body: JSON.stringify({ SKU: sku }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "<no body>");

    if (res.status === 404) {
      console.warn(
        "Avasam GetProductWarehouseDetail missing shipping",
        sku,
        body,
      );
      return [];
    }

    console.error("Avasam GetProductWarehouseDetail error", sku, res.status, body);
    return [];
  }

  const data = await res.json().catch(() => null);

  if (!data) {
    return [];
  }

  const candidateLists = [
    Array.isArray(data) ? data : null,
    Array.isArray(data?.WarehouseDetails) ? data.WarehouseDetails : null,
    Array.isArray(data?.Warehouses) ? data.Warehouses : null,
    Array.isArray(data?.ShippingOptions) ? data.ShippingOptions : null,
  ].filter(Boolean) as any[];

  const flattened = candidateLists.length > 0 ? candidateLists[0] : [];

  if (!Array.isArray(flattened)) {
    return [];
  }

  const detailedOptions: any[] = [];

  flattened.forEach((entry) => {
    if (!entry) return;
    if (Array.isArray(entry.ShippingServices)) {
      entry.ShippingServices.forEach((service: any) => {
        detailedOptions.push({ ...service, WarehouseId: entry.WarehouseId ?? entry.WarehouseID, WarehouseName: entry.WarehouseName ?? entry.Warehouse });
      });
    } else {
      detailedOptions.push(entry);
    }
  });

  if (detailedOptions.length === 0) {
    return flattened.map((raw) => normalizeShippingOption(raw));
  }

  return detailedOptions.map((raw) => normalizeShippingOption(raw));
}
