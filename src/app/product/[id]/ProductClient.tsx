"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { SeasonalProduct } from "@/lib/products";
import { ImageGallery } from "./ImageGallery";
import type { AvasamProduct } from "@/lib/avasam";

type DisplayPrice =
  | { kind: "single"; value: number }
  | { kind: "range"; min: number; max: number }
  | null;

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
  const variants = useMemo(() => (avasam?.Variations as any[]) ?? [], [avasam]);

  const variantColourMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(avasam?.ExtendedProperties)) {
      avasam.ExtendedProperties.forEach((prop) => {
        if (!prop || typeof prop.Value !== "string") return;
        const name = prop.Name?.toString() ?? "";
        const match = /colou?r\W*([A-Za-z0-9]+)/i.exec(name);
        if (match && match[1]) {
          map.set(match[1].toUpperCase(), prop.Value.trim());
        }
      });
    }
    return map;
  }, [avasam?.ExtendedProperties]);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const selectedVariant =
    selectedVariantIndex != null && variants[selectedVariantIndex]
      ? variants[selectedVariantIndex]
      : null;

  const baseGalleryImages = useMemo(() => {
    if (avasam?.ProductImage && avasam.ProductImage.length > 0) {
      return avasam.ProductImage as string[];
    }

    if (product.image_url) {
      return [product.image_url];
    }

    if (avasam?.Image) {
      return [avasam.Image];
    }

    return ["/placeholder.png"];
  }, [avasam?.Image, avasam?.ProductImage, product.image_url]);

  const forcedVariantImage = useMemo(() => {
    if (!selectedVariant) return null;

    if (Array.isArray(selectedVariant.Images) && selectedVariant.Images.length > 0) {
      return selectedVariant.Images[0] as string;
    }

    if (selectedVariant.MainImage) {
      return selectedVariant.MainImage as string;
    }

    return baseGalleryImages[0];
  }, [selectedVariant, baseGalleryImages]);

  const displayPrice: DisplayPrice = useMemo(() => {
    if (selectedVariant) {
      const price = computeVariantPriceWithMarkup(avasam, selectedVariant);
      return price != null ? { kind: "single", value: price } : null;
    }

    const variantPrices = variants
      .map((v) => computeVariantPriceWithMarkup(avasam, v))
      .filter((p): p is number => typeof p === "number" && !Number.isNaN(p));

    if (variantPrices.length > 0) {
      const min = Math.min(...variantPrices);
      const max = Math.max(...variantPrices);
      if (Math.round(min * 100) === Math.round(max * 100)) {
        return { kind: "single", value: min } as const;
      }
      return { kind: "range", min, max } as const;
    }

    if (typeof product.price_with_markup === "number") {
      return { kind: "single", value: product.price_with_markup } as const;
    }

    return null;
  }, [avasam, product.price_with_markup, selectedVariant, variants]);

  const variantsWithMeta = useMemo(() => {
    return variants
      .map((variant, index) => {
        const attributes =
          variant && typeof variant === "object" && typeof variant.Attributes === "object"
            ? (variant.Attributes as Record<string, unknown>)
          : {};
        const attrEntries = Object.entries(attributes);

        const codeCandidate = (() => {
          const fromAttr = attrEntries.find(([key]) => key.toLowerCase().includes("colour"));
          if (fromAttr && typeof fromAttr[1] === "string" && fromAttr[1].trim()) {
            return fromAttr[1].trim();
          }
          if (typeof variant.color === "string" && variant.color.trim()) {
            return variant.color.trim();
          }
          if (typeof variant.Colour === "string" && variant.Colour.trim()) {
            return variant.Colour.trim();
          }
          return undefined;
        })();

        let colourName: string | undefined;
        if (codeCandidate) {
          colourName = variantColourMap.get(codeCandidate.toUpperCase());
        }

        if (!colourName) {
          colourName = attrEntries
            .filter(([key]) => key.toLowerCase().includes("colour") || key.toLowerCase().includes("color"))
            .map(([, value]) => (typeof value === "string" ? value.trim() : ""))
            .find((value) => value.length > 1 && !/^[A-Za-z]\d?$/u.test(value));
        }

        if (!colourName) {
          colourName = [variant.ColourName, variant.ColorName, variant.Name, variant.Label]
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .find((value) => value.length > 1 && !/^[A-Za-z]\d?$/u.test(value)) || undefined;
        }

        const styleEntry = attrEntries.find(([key]) => key.toLowerCase().includes("style"));
        const rawStyle = styleEntry && typeof styleEntry[1] === "string" ? styleEntry[1].trim() : undefined;
        const styleNumber = rawStyle ? Number.parseInt(rawStyle.replace(/[^0-9]/g, ""), 10) : undefined;
        const styleLabel = rawStyle
          ? rawStyle.toLowerCase().includes("style")
            ? rawStyle.replace(/\s+/g, " ")
            : `Style ${rawStyle}`
          : undefined;

        let primary = colourName;
        const secondaryParts: string[] = [];

        if (!primary && styleLabel) {
          primary = styleLabel;
        } else if (primary && styleLabel) {
          secondaryParts.push(styleLabel);
        }

        if (!primary && codeCandidate) {
          primary = `Colour ${codeCandidate.toUpperCase()}`;
        } else if (codeCandidate && primary && !primary.toUpperCase().includes(codeCandidate.toUpperCase())) {
          secondaryParts.push(`Colour ${codeCandidate.toUpperCase()}`);
        }

        const fallbackPrimary = variant.SKU && typeof variant.SKU === "string" ? variant.SKU : "Variant";
        const primaryTitle = (primary ?? fallbackPrimary).trim();

        const secondary = secondaryParts.length > 0 ? secondaryParts.join(" • ") : undefined;

        const thumb =
          variant.MainImage ??
          (Array.isArray(variant.Images) && variant.Images.length > 0
            ? (variant.Images[0] as string)
            : null);

        const sortKey =
          typeof styleNumber === "number" && !Number.isNaN(styleNumber)
            ? `style-${styleNumber.toString().padStart(3, "0")}`
            : primaryTitle.toLowerCase();

        return {
          variant,
          index,
          primary: primaryTitle,
          secondary,
          code: codeCandidate,
          thumb,
          sortKey,
          styleNumber: typeof styleNumber === "number" && !Number.isNaN(styleNumber)
            ? styleNumber
            : undefined,
        };
      })
      .sort((a, b) =>
        a.sortKey.localeCompare(b.sortKey, undefined, { numeric: true, sensitivity: "base" }),
      );
  }, [variants, variantColourMap]);

  useEffect(() => {
    if (variantsWithMeta.length > 0) {
      console.log(
        "Avasam variants",
        variantsWithMeta.map(({ primary, secondary, code, styleNumber }) => ({
          primary,
          secondary,
          code,
          styleNumber,
        })),
      );
    }
  }, [variantsWithMeta]);

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
          images={baseGalleryImages}
          alt={product.name || avasam?.Title || "Product"}
          forcedImage={forcedVariantImage}
          activeIndex={selectedVariant ? undefined : galleryIndex}
          onSelect={(idx) => {
            setSelectedVariantIndex(null);
            setGalleryIndex(idx);
          }}
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
            {displayPrice?.kind === "single" && (
              <span className="text-2xl font-semibold text-slate-900">
                £{displayPrice.value.toFixed(2)}
              </span>
            )}
            {displayPrice?.kind === "range" && (
              <span className="text-2xl font-semibold text-slate-900">
                £{displayPrice.min.toFixed(2)} – £{displayPrice.max.toFixed(2)}
              </span>
            )}
          </div>
          {variantsWithMeta.length > 0 && (
            <div className="space-y-2 text-xs">
              <p className="font-medium text-slate-700">Variant</p>
              <div className="flex flex-wrap gap-2">
                {variantsWithMeta.map(({ variant: v, index, primary, secondary, code, thumb }) => {
                  const isActive = index === selectedVariantIndex;
                  return (
                    <button
                      key={v.SKU}
                      type="button"
                      onClick={() => {
                        if (selectedVariantIndex === index) {
                          setSelectedVariantIndex(null);
                        } else {
                          setSelectedVariantIndex(index);
                        }
                      }}
                      className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {thumb && (
                        <span className="relative h-7 w-7 overflow-hidden rounded-full bg-slate-100">
                          <Image
                            src={thumb}
                            alt={primary}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </span>
                      )}
                      <span className="text-left leading-tight">
                        <span className="font-semibold">{primary}</span>
                        {(secondary || (code && !primary.toUpperCase().includes(code.toUpperCase()))) && (
                          <span className="block text-[10px] font-normal opacity-80">
                            {[secondary, code && !primary.toUpperCase().includes(code.toUpperCase())
                              ? `Colour ${code.toUpperCase()}`
                              : null]
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        )}
                      </span>
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
