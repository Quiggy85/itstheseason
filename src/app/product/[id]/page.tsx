import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductsForCurrentSeason } from "@/lib/products";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const { products } = await getProductsForCurrentSeason();

  const paramId =
    // Prefer explicit id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params as any).id ??
    // Fallback: first value in params object if key name differs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(params as any)[0];

  console.log("ProductPage params", params);
  console.log("ProductPage resolved paramId", paramId);
  console.log("ProductPage product ids", products.map((p) => p.id));

  const product = products.find((p) => p.id === paramId) ?? null;

  if (!product) {
    notFound();
  }

  const imageSrc =
    product.image_url ||
    product.avasam?.Image ||
    product.avasam?.ProductImage?.[0] ||
    "/placeholder.png";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,_3fr)_minmax(0,_2fr)]">
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          ← Back to season
        </Link>
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-100">
          <Image
            src={imageSrc}
            alt={product.name || product.avasam?.Title || "Product"}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Seasonal pick
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {product.name || product.avasam?.Title}
        </h1>
        <p className="text-sm text-slate-600">
          {product.description || product.avasam?.Description}
        </p>

        <div className="mt-4 flex items-baseline gap-3">
          {product.price_with_markup != null && (
            <span className="text-2xl font-semibold text-slate-900">
              £{product.price_with_markup.toFixed(2)}
            </span>
          )}
          {product.avasam?.Price != null && (
            <span className="text-xs text-slate-500">
              Base £{product.avasam.Price.toFixed(2)}
            </span>
          )}
        </div>

        <div className="mt-4 space-y-1 text-xs text-slate-500">
          {product.avasam?.SKU && (
            <p>SKU: {product.avasam.SKU}</p>
          )}
          {product.avasam?.Category && (
            <p>Category: {product.avasam.Category}</p>
          )}
          {product.avasam?.ProductWeight && (
            <p>Weight: {product.avasam.ProductWeight} kg</p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
          Checkout and shipping flows will be added next. For now, this page
          shows full product details enriched from Avasam.
        </div>
      </div>
    </div>
  );
}
