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
  Title: string;
  Description?: string;
  Image?: string;
  ProductImage?: string[];
  Category?: string;
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

  console.log("Avasam GetSellerProductList returned", data.length, "items");

  const skuSet = new Set(skus);

  return (data as AvasamProduct[]).filter((p) => skuSet.has(p.SKU));
}
