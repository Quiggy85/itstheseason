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
  const coverImage = product.images?.[0];
  const hasDeliveryWindow =
    product.estimatedDeliveryMinDays !== undefined &&
    product.estimatedDeliveryMaxDays !== undefined;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-lg">
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt={product.title}
          className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
          Image coming soon
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-zinc-900 line-clamp-2">
            {product.title}
          </h3>
          {product.description ? (
            <p className="text-sm text-zinc-600 line-clamp-3">{product.description}</p>
          ) : null}
        </div>
        <div className="mt-auto space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold text-zinc-900">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.inventory !== undefined ? (
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                {product.inventory > 0 ? "In stock" : "Back soon"}
              </span>
            ) : null}
          </div>
          {hasDeliveryWindow ? (
            <p className="text-xs text-zinc-500">
              Estimated UK delivery: {product.estimatedDeliveryMinDays}&ndash;
              {product.estimatedDeliveryMaxDays} days
            </p>
          ) : null}
          {product.tags && product.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {product.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"
                >
                  #{tag}
                </span>
              ))}
              {product.tags.length > 3 ? (
                <span className="text-xs text-zinc-500">
                  +{product.tags.length - 3} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 text-sm text-zinc-500">
          {product.returnsPolicy ? (
            <p>
              <span className="font-medium text-zinc-700">Returns:</span> {product.returnsPolicy}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 pt-4">
          <Link
            href={`/products/${product.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            View details
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-200 hover:text-blue-700"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
