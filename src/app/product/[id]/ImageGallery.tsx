"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  alt: string;
  activeIndex?: number;
  forcedImage?: string | null;
  onSelect?: (index: number) => void;
};

export function ImageGallery({ images, alt, activeIndex, forcedImage, onSelect }: Props) {
  const [internalIndex, setInternalIndex] = useState(0);

  const currentIndex =
    typeof activeIndex === "number" && activeIndex >= 0
      ? activeIndex
      : internalIndex;

  const main = forcedImage ?? images[currentIndex] ?? images[0];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-100">
        <Image
          src={main}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              onClick={() => {
                if (typeof onSelect === "function") {
                  onSelect(idx);
                } else {
                  setInternalIndex(idx);
                }
              }}
              className={`relative aspect-square overflow-hidden rounded-xl border bg-slate-100 transition ${
                idx === currentIndex && !forcedImage
                  ? "border-slate-900"
                  : "border-transparent hover:border-slate-300"
              }`}
            >
              <Image
                src={img}
                alt={`${alt} thumbnail ${idx + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
