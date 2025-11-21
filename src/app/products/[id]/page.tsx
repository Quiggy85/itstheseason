import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { fetchProductById } from "@/lib/catalog/fetch-product";
import { fetchCatalogBySlug } from "@/lib/catalog/fetch-catalog";
import type { CatalogProduct, CatalogEvent } from "@/lib/catalog/types";
import { MARKET_CONFIG } from "@/config/market";
import { formatMarketCurrency } from "@/lib/market/utils";

function formatPrice(value: number, currency?: string) {
  const targetCurrency = currency?.toUpperCase();
  if (!targetCurrency || targetCurrency === MARKET_CONFIG.currencyCode) {
    return formatMarketCurrency(value);
  }

  return new Intl.NumberFormat(MARKET_CONFIG.locale, {
    style: "currency",
    currency: targetCurrency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShippingDetails(product: CatalogProduct) {
  const shippingCurrency = product.shippingCurrency ?? product.currency;
  const shippingCostLabel =
    typeof product.shippingCost === "number"
      ? formatPrice(product.shippingCost, shippingCurrency)
      : null;
  const hasShippingWindow =
    product.shippingEstimatedMinDays !== undefined &&
    product.shippingEstimatedMaxDays !== undefined;
  const shippingWindowLabel = hasShippingWindow
    ? `${product.shippingEstimatedMinDays}–${product.shippingEstimatedMaxDays} days`
    : product.estimatedDeliveryMinDays !== undefined && product.estimatedDeliveryMaxDays !== undefined
      ? `${product.estimatedDeliveryMinDays}–${product.estimatedDeliveryMaxDays} days`
      : null;

  const parts: string[] = [];
  parts.push(shippingCostLabel ? `Shipping from ${shippingCostLabel}` : "Shipping calculated at checkout");
  if (product.shippingMethod) {
    parts.push(product.shippingMethod);
  }
  parts.push(shippingWindowLabel ?? MARKET_CONFIG.shipping.fallbackTagline);
  return parts.join(" • ");
}

function buildGalleryImages(product: CatalogProduct) {
  const urls = product.images?.length ? product.images : []; // Guard for undefined
  if (urls.length === 0) {
    return [
      {
        url: "https://images.unsplash.com/photo-1511389026070-a14ae610a1be?auto=format&fit=crop&w=1200&q=80",
        alt: "Seasonal gift placeholder",
      },
    ];
  }

  return urls.map((url, index) => ({
    url,
    alt: `${product.title} image ${index + 1}`,
  }));
}

type MaybePromise<T> = T | Promise<T>;

type ProductPageProps = {
  params: MaybePromise<{
    id: string | string[];
  }>;
  searchParams?: MaybePromise<{
    event?: string | string[];
  }>;
};

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawId = Array.isArray(resolvedParams?.id)
    ? resolvedParams?.id[0]
    : resolvedParams?.id ?? "";
  const id = decodeURIComponent(rawId).split("?")[0]?.trim();

  const eventSlugParam = Array.isArray(resolvedSearchParams?.event)
    ? resolvedSearchParams?.event[0]
    : resolvedSearchParams?.event;

  if (!id) {
    console.warn("[ProductPage] missing product id", { rawId, searchParams: resolvedSearchParams });
    notFound();
  }

  console.log("[ProductPage] request", { id, eventSlugParam });

  const { data, error } = await fetchProductById(id);

  let product: CatalogProduct | undefined;
  let event: CatalogEvent | null | undefined = null;

  if (data?.product) {
    product = data.product;
    event = data.event;
  } else if (error?.status === 404 && eventSlugParam) {
    const { data: fallbackData, error: fallbackError } = await fetchCatalogBySlug(eventSlugParam, {
      limit: 100,
      requireDestinationShipping: MARKET_CONFIG.shipping.requireDestinationMatch,
      destinationCountryCode: MARKET_CONFIG.shipping.destinationCountryCode,
    });

    console.log("[ProductPage] fallback fetch", {
      fallbackError,
      productCount: fallbackData?.products.length,
      firstProductId: fallbackData?.products[0]?.id,
    });

    if (fallbackError?.status === 404) {
      notFound();
    }

    if (fallbackData) {
      product = fallbackData.products.find((candidate) => candidate.id === id);
      event = fallbackData.event;
      console.log("[ProductPage] fallback lookup result", { matched: Boolean(product) });
    }
  }

  if (!product) {
    if (error?.status === 404) {
      notFound();
    }
    throw new Error(error?.message ?? "Unable to load product");
  }

  const gallery = buildGalleryImages(product);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-zinc-700">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-zinc-400">
              /
            </li>
            <li>
              {event ? (
                <Link href={`/catalog/${event.slug}`} className="transition hover:text-zinc-700">
                  {event.name}
                </Link>
              ) : (
                <span className="text-zinc-600">Seasonal collection</span>
              )}
            </li>
            <li aria-hidden className="text-zinc-400">
              /
            </li>
            <li className="text-zinc-700">{product.title}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
              <div className="relative aspect-square">
                <Image
                  src={gallery[0]?.url ?? ""}
                  alt={gallery[0]?.alt ?? product.title}
                  fill
                  sizes="(min-width: 1024px) 32rem, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            {gallery.length > 1 ? (
              <div className="grid grid-cols-4 gap-4">
                {gallery.slice(1, 5).map((image) => (
                  <div key={image.url} className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
                    <div className="relative aspect-square">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1024px) 6rem, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-8">
            <header className="space-y-4">
              {event ? (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {event.name}
                </span>
              ) : null}
              <h1 className="text-4xl font-semibold text-zinc-900 sm:text-5xl">{product.title}</h1>
              {product.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {product.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            <div className="rounded-3xl border border-zinc-100 bg-white/90 p-8 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm uppercase tracking-wide text-zinc-500">Price</p>
                  <p className="text-3xl font-semibold text-zinc-900">
                    {formatPrice(product.price, product.currency)}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-blue-50/70 p-4">
                    <p className="text-sm font-medium text-blue-900">UK Delivery</p>
                    {product.estimatedDeliveryMinDays !== undefined &&
                    product.estimatedDeliveryMaxDays !== undefined ? (
                      <p className="text-sm text-blue-800">
                        {product.estimatedDeliveryMinDays}&ndash;{product.estimatedDeliveryMaxDays} days
                      </p>
                    ) : (
                      <p className="text-sm text-blue-800">Typically ships within a week</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-emerald-50/70 p-4">
                    <p className="text-sm font-medium text-emerald-900">Availability</p>
                    <p className="text-sm text-emerald-800">
                      {product.inventory && product.inventory > 0 ? "In stock" : "Ships on demand"}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <p className="text-sm font-medium text-blue-900">Shipping</p>
                  <p className="text-sm text-blue-800">{formatShippingDetails(product)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
                    disabled
                  >
                    Add to cart (coming soon)
                  </button>
                  <Link
                    href="/support/contact"
                    className="inline-flex items-center justify-center rounded-full border border-blue-100 px-6 py-3 text-sm font-semibold text-blue-600 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    Need help?
                  </Link>
                </div>
              </div>
            </div>

            {product.description ? (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-zinc-900">Product details</h2>
                <p className="text-base leading-relaxed text-zinc-600 whitespace-pre-line">
                  {product.description}
                </p>
              </section>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2">
              {product.shippingPolicy ? (
                <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    Shipping policy
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 whitespace-pre-line">
                    {product.shippingPolicy}
                  </p>
                </div>
              ) : null}

              {product.returnsPolicy ? (
                <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    Returns policy
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 whitespace-pre-line">
                    {product.returnsPolicy}
                  </p>
                </div>
              ) : null}
            </section>

            <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 text-white shadow-lg">
              <h3 className="text-lg font-semibold">Stay in the seasonal loop</h3>
              <p className="mt-1 text-sm text-zinc-200">
                Join our mailing list to hear when fresh drops arrive and new collections open.
              </p>
              <form className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-full border border-white/30 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 focus:border-white/60 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700"
                  disabled
                >
                  Notify me (soon)
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
