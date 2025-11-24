"use client";

import Link from "next/link";

import type { SeasonalProduct } from "@/lib/products";
import { ImageGallery } from "./ImageGallery";
import type { AvasamProduct } from "@/lib/avasam";

const MARKUP_PERCENT = Number(process.env.NEXT_PUBLIC_PRICE_MARKUP_PERCENT ?? 20);

function computeVariantPriceWithMarkup(parent: AvasamProduct | null, variant: any | null) {
  if (!parent || !variant) return null;

  const netPrice = typeof variant.Price === "number" ? variant.Price : parent.Price;
  if (typeof netPrice !== "number") return null;

  const vatPct =
    parent.VATPercentage ?? (typeof parent.Vat === "number" ? parent.Vat : undefined) ?? 20;

  const baseIncVat = netPrice * (1 + vatPct / 100);

  return Math.round(baseIncVat * (1 + MARKUP_PERCENT / 100) * 100) / 100;
}

export function ProductClient({ product }: { product: SeasonalProduct }) {
  const avasam = product.avasam ?? null;
  const variants = (avasam?.Variations as any[]) ?? [];

  const [activeIndex, setActiveIndex] = React.useState(() => {
    const selected = variants.findIndex((v) => v.IsSelected);
    return selected >= 0 ? selected : 0;
  });

  const activeVariant = variants[activeIndex] ?? null;

  const galleryImages = (() => {
    if (activeVariant && Array.isArray(activeVariant.Images) && activeVariant.Images.length > 0) {
      return activeVariant.Images as string[];
    }

    if (avasam?.ProductImage && avasam.ProductImage.length > 0) {
      return avasam.ProductImage as string[];
    }

    const fallback =
      product.image_url || avasam?.Image || (activeVariant && activeVariant.MainImage) || "/placeholder.png";

    return [fallback];
  })();

  const variantPrice = computeVariantPriceWithMarkup(avasam, activeVariant);
  const displayPrice =
    variantPrice ?? product.price_with_markup ?? (avasam ? computeVariantPriceWithMarkup(avasam, null) : null);

  const variantLabel = (v: any) => {
    const colour = (v.Attributes && v.Attributes.Colour) || v.color;
    return colour || v.SKU;
  };

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
          alt={product.name || avasam?.Title || "Product"}
        />
      </div>

      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Seasonal pick
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {product.name || avasam?.Title}
        </h1>
        <div className="space-y-3 text-sm text-slate-600">
          {product.description && <p>{product.description}</p>}
          {!product.description && avasam?.Description && <p>{avasam.Description}</p>}
          {avasam?.MultiDescription?.en && (
            <div
              className="prose prose-sm max-w-none text-slate-700 [&_h2]:mt-4 [&_h2]:text-base [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: avasam.MultiDescription.en }}
            />
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-baseline gap-3">
            {displayPrice != null && (
              <span className="text-2xl font-semibold text-slate-900">
                £{displayPrice.toFixed(2)}
              </span>
            )}
          </div>
          {variants.length > 0 && (
            <div className="space-y-2 text-xs">
              <p className="font-medium text-slate-700">Variant</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={v.SKU}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {v.MainImage && (
                        <span className="relative h-7 w-7 overflow-hidden rounded-full bg-slate-100">
                          <img
                            src={v.MainImage}
                            alt={variantLabel(v)}
                            className="h-full w-full object-cover"
                          />
                        </span>
                      )}
                      <span>{variantLabel(v)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-1 text-xs text-slate-500">
          {avasam?.SKU && <p>SKU: {avasam.SKU}</p>}
          {avasam?.Category && <p>Category: {avasam.Category}</p>}
          {avasam?.ProductWeight && <p>Weight: {avasam.ProductWeight} kg</p>}
          {avasam?.ExtendedProperties && avasam.ExtendedProperties.length > 0 && (
            <div className="pt-2">
              <p className="mb-1 font-semibold text-slate-600">Product details</p>
              <ul className="space-y-0.5 text-[11px] text-slate-500">
                {avasam.ExtendedProperties.map((prop) => (
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
