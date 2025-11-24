const AVASAM_BASE_URL =
  process.env.AVASAM_API_BASE_URL ?? "https://app.avasam.com/apiseeker";
const AVASAM_AUTH_URL =
  process.env.AVASAM_API_AUTH_URL ?? "https://app.avasam.com/api/auth";
const AVASAM_CONSUMER_KEY = process.env.AVASAM_API_CONSUMER_KEY;
const AVASAM_CONSUMER_SECRET = process.env.AVASAM_API_CONSUMER_SECRET;

export type AvasamProduct = {
  SKU: string;
  Price: number;
  RetailPrice?: number;
  Title: string;
  Description?: string;
  Image?: string;
  ProductImage?: string[];
  Category?: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAuthKey(): Promise<string> {
  // Reuse token if it hasn't expired yet
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
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
    },
    body: JSON.stringify({
      Authkey: authKey,
      Page: 0,
      Limit: skus.length,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products from Avasam: ${res.status}`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    console.warn("Unexpected Avasam product list response shape", data);
    return [];
  }

  const skuSet = new Set(skus);

  return (data as AvasamProduct[]).filter((p) => skuSet.has(p.SKU));
}
