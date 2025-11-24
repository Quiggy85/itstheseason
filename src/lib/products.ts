import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCurrentSeason } from "@/lib/seasons";
import { getProductsBySkus, type AvasamProduct } from "@/lib/avasam";

const MARKUP_PERCENT = Number(process.env.PRICE_MARKUP_PERCENT ?? 20);

export type SeasonalProduct = {
  id: string;
  avasam_sku: string;
  name: string;
  description: string | null;
  image_url: string | null;
  retail_price: number | null;
  currency: string | null;
  price_with_markup: number | null;
  avasam: AvasamProduct | null;
};

export async function getProductsForCurrentSeason(): Promise<{
  season: Awaited<ReturnType<typeof getCurrentSeason>>;
  products: SeasonalProduct[];
}> {
  const supabase = createSupabaseServerClient();
  const season = await getCurrentSeason();

  if (!season) {
    return { season: null, products: [] };
  }

  const { data: joined, error } = await supabase
    .from("product_seasons")
    .select("products:products(id, avasam_sku, name, description, image_url, retail_price, currency)")
    .eq("season_id", season.id);

  if (error) {
    console.error("Error fetching products for season", error.message);
    return { season, products: [] };
  }

  const flatProducts = (joined ?? [])
    .map((row: any) => row.products)
    .filter(Boolean) as {
    id: string;
    avasam_sku: string;
    name: string;
    description: string | null;
    image_url: string | null;
    retail_price: number | null;
    currency: string | null;
  }[];

  const skus = flatProducts.map((p) => p.avasam_sku).filter(Boolean);

  const avasamProducts = await getProductsBySkus(skus);
  const avasamBySku = new Map(avasamProducts.map((p) => [p.SKU, p]));

  const products: SeasonalProduct[] = flatProducts.map((p) => {
    const avasam = avasamBySku.get(p.avasam_sku) ?? null;
    // Prefer VAT-inclusive cost from Avasam; fall back sensibly
    let basePrice: number | null = null;

    if (avasam) {
      const vatPct =
        avasam.VATPercentage ??
        (typeof avasam.Vat === "number" ? avasam.Vat : undefined);

      if (typeof avasam.PriceIncVat === "number") {
        basePrice = avasam.PriceIncVat;
      } else if (vatPct != null && typeof avasam.Price === "number") {
        basePrice = avasam.Price * (1 + vatPct / 100);
      } else if (typeof avasam.Price === "number") {
        basePrice = avasam.Price;
      }
    }

    if (basePrice == null && p.retail_price != null) {
      basePrice = p.retail_price;
    }

    const priceWithMarkup =
      basePrice != null
        ? Math.round(basePrice * (1 + MARKUP_PERCENT / 100) * 100) / 100
        : null;

    return {
      ...p,
      price_with_markup: priceWithMarkup,
      avasam,
    };
  });

  return { season, products };
}
