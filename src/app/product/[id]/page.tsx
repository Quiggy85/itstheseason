import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductsForCurrentSeason } from "@/lib/products";
import { ImageGallery } from "./ImageGallery";
import { VariantSelector } from "./VariantSelector";

export default async function ProductPage({
  params,
}: {
  // In React 19/Next 16, params is a Promise in server components
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const { products } = await getProductsForCurrentSeason();

  const paramId = resolvedParams.id;

  console.log("ProductPage resolved paramId", paramId);
  console.log("ProductPage product ids", products.map((p) => p.id));

  const product = products.find((p) => p.id === paramId) ?? null;

  if (!product) {
    notFound();
  }

  const galleryImages = (
    product.avasam?.ProductImage && product.avasam.ProductImage.length > 0
      ? product.avasam.ProductImage
      : [
          product.image_url ||
            product.avasam?.Image ||
            "/placeholder.png",
        ]
  ).filter(Boolean) as string[];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,_3fr)_minmax(0,_2fr)]">
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          ← Back to season
        </Link>
        <ImageGallery
          images={galleryImages}
          alt={product.name || product.avasam?.Title || "Product"}
        />
      </div>

      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Seasonal pick
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {product.name || product.avasam?.Title}
        </h1>
        <div className="space-y-3 text-sm text-slate-600">
          {product.description && <p>{product.description}</p>}
          {!product.description && product.avasam?.Description && (
            <p>{product.avasam.Description}</p>
          )}
          {product.avasam?.MultiDescription?.en && (
            <div
              className="prose prose-sm max-w-none text-slate-700 [&_h2]:mt-4 [&_h2]:text-base [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{
                __html: product.avasam.MultiDescription.en,
              }}
            />
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-slate-900">
              £{product.price_with_markup?.toFixed(2) ?? "-"}
            </span>
          </div>
          <VariantSelector avasam={product.avasam} />
        </div>

        <div className="mt-4 space-y-1 text-xs text-slate-500">
          {product.avasam?.SKU && <p>SKU: {product.avasam.SKU}</p>}
          {product.avasam?.Category && <p>Category: {product.avasam.Category}</p>}
          {product.avasam?.ProductWeight && (
            <p>Weight: {product.avasam.ProductWeight} kg</p>
          )}
          {product.avasam?.ExtendedProperties &&
            product.avasam.ExtendedProperties.length > 0 && (
              <div className="pt-2">
                <p className="mb-1 font-semibold text-slate-600">
                  Product details
                </p>
                <ul className="space-y-0.5 text-[11px] text-slate-500">
                  {product.avasam.ExtendedProperties.map((prop) => (
                    <li key={`${prop.Name}-${prop.Value}`}>
                      <span className="font-medium">{prop.Name}:</span> {" "}
                      {prop.Value}
                    </li>
                  ))}
                </ul>
              </div>
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
