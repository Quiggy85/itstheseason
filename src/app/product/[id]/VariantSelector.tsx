"use client";

import { useMemo, useState } from "react";
import type { AvasamProduct } from "@/lib/avasam";

const MARKUP_PERCENT = Number(process.env.NEXT_PUBLIC_PRICE_MARKUP_PERCENT ?? 20);

type Variant = NonNullable<AvasamProduct["Variations"]>[number];

type Props = {
  avasam: AvasamProduct | null;
  onVariantChange?: (variant: Variant | null, priceWithMarkup: number | null) => void;
};

function computeVariantPriceWithMarkup(parent: AvasamProduct | null, variant: Variant | null) {
  if (!parent || !variant) return null;

  const netPrice = typeof variant.Price === "number" ? variant.Price : parent.Price;
  if (typeof netPrice !== "number") return null;

  const vatPct =
    parent.VATPercentage ?? (typeof parent.Vat === "number" ? parent.Vat : undefined) ?? 20;

  const baseIncVat = netPrice * (1 + vatPct / 100);

  return Math.round(baseIncVat * (1 + MARKUP_PERCENT / 100) * 100) / 100;
}

export function VariantSelector({ avasam, onVariantChange }: Props) {
  const variants = useMemo(() => avasam?.Variations ?? [], [avasam]);

  const [activeIndex, setActiveIndex] = useState(() =>
    variants.findIndex((v: Variant) => v.IsSelected) >= 0
      ? variants.findIndex((v: Variant) => v.IsSelected)
      : 0,
  );

  const activeVariant = variants[activeIndex] ?? null;

  const priceWithMarkup = useMemo(
    () => computeVariantPriceWithMarkup(avasam ?? null, activeVariant),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [avasam, activeIndex],
  );

  if (!avasam || variants.length === 0) {
    return null;
  }

  if (onVariantChange) {
    onVariantChange(activeVariant, priceWithMarkup);
  }

  const label = (v: Variant) => {
    const colour = (v.Attributes && (v.Attributes as any).Colour) || v.color;
    return colour || v.SKU;
  };

  return (
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
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {label(v)}
            </button>
          );
        })}
      </div>
      {priceWithMarkup != null && (
        <p className="pt-1 text-[11px] text-slate-500">
          Selected variant price: £{priceWithMarkup.toFixed(2)}
        </p>
      )}
    </div>
  );
}
