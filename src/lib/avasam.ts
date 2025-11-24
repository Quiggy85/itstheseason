const AVASAM_BASE_URL = process.env.AVASAM_API_BASE_URL ?? "https://app.avasam.com/apiseeker";
const AVASAM_USERNAME = process.env.AVASAM_API_USERNAME;
const AVASAM_PASSWORD = process.env.AVASAM_API_PASSWORD;

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

async function getAuthKey(): Promise<string> {
  if (!AVASAM_USERNAME || !AVASAM_PASSWORD) {
    throw new Error("Avasam credentials are not set. AVASAM_API_USERNAME and AVASAM_API_PASSWORD are required.");
  }

  const res = await fetch(`${AVASAM_BASE_URL}/Login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Username: AVASAM_USERNAME,
      Password: AVASAM_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to authenticate with Avasam: ${res.status}`);
  }

  const data = await res.json();

  if (!data.Authkey) {
    throw new Error("Avasam login response did not contain Authkey. Please verify credentials and API docs.");
  }

  return data.Authkey as string;
}

export async function getProductsBySkus(skus: string[]): Promise<AvasamProduct[]> {
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
