import Link from "next/link";

import type { CatalogProduct } from "@/lib/catalog/types";

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

interface ProductCardProps {
  product: CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  if (!product.id) {
    return null;
  }

  const coverImage = product.images?.[0];
  const hasDeliveryWindow =
    product.estimatedDeliveryMinDays !== undefined &&
    product.estimatedDeliveryMaxDays !== undefined;

  const productLink = product.eventSlug
    ? `/products/${product.id}?event=${product.eventSlug}`
    : `/products/${product.id}`;

  return (
    <Link
      href={productLink}
      className="group relative block h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/60"
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-4xl border border-transparent bg-white/95 shadow-[0_18px_50px_-25px_rgba(30,64,175,0.45)] transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_22px_60px_-30px_rgba(30,64,175,0.55)]">
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-blue-100 via-sky-50 to-white">
          <div className="absolute inset-0 rounded-3xl border border-white/40 transition-opacity group-hover:opacity-0" />
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-zinc-500">
              Image coming soon
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent opacity-80" />
          <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600 shadow-sm">
            Seasonal pick
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold leading-tight text-zinc-900 line-clamp-2">
              {product.title}
            </h3>
            {product.description ? (
              <p className="text-sm text-zinc-600 line-clamp-3">{product.description}</p>
            ) : null}
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-2xl font-semibold text-zinc-900">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.inventory !== undefined ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {product.inventory > 0 ? "In stock" : "Back soon"}
                </span>
              ) : null}
            </div>

            {hasDeliveryWindow ? (
              <p className="text-xs font-medium text-blue-700/80">
                Estimated UK delivery: {product.estimatedDeliveryMinDays}&ndash;
                {product.estimatedDeliveryMaxDays} days
              </p>
            ) : (
              <p className="text-xs font-medium text-blue-700/80">Fast dispatch from CJ partners</p>
            )}

            {product.tags && product.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                  >
                    #{tag}
                  </span>
                ))}
                {product.tags.length > 3 ? (
                  <span className="text-xs text-blue-700/70">+{product.tags.length - 3} more</span>
                ) : null}
              </div>
            ) : null}

            <div className="flex items-center gap-3 pt-2 text-xs text-zinc-500">
              {product.shippingPolicy ? (
                <p>
                  <span className="font-medium text-zinc-700">Shipping:</span> {product.shippingPolicy}
                </p>
              ) : null}
              {product.returnsPolicy ? (
                <p>
                  <span className="font-medium text-zinc-700">Returns:</span> {product.returnsPolicy}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 group-hover:scale-[1.02]">
              View details
            </span>
            <span className="inline-flex items-center justify-center rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
              Add soon
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
