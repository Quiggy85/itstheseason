import Link from "next/link";

import { getCurrentSeasonalEvent } from "@/config/seasonal-events";
import { ProductCard } from "@/components/catalog/product-card";
import { SeasonalHero } from "@/components/catalog/seasonal-hero";
import { fetchCatalogBySlug } from "@/lib/catalog/fetch-catalog";

export default async function Home() {
  const seasonalConfig = getCurrentSeasonalEvent();
  const { data, error } = await fetchCatalogBySlug(seasonalConfig.slug, {
    limit: 24,
    requireUkShipping: true,
  });

  if (error || !data) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
          We’re refreshing the seasonal collection
        </h1>
        <p className="max-w-2xl text-base text-zinc-600">
          {error?.message ?? "Please check back in a moment while we update our catalogue."}
        </p>
        <Link
          href="/support/contact"
          className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Contact support
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <SeasonalHero config={seasonalConfig} event={data.event} />

      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900">Featured arrivals</h2>
          <Link
            href={`/catalog/${data.event.slug}`}
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            View full collection
          </Link>
        </div>
        {data.products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/60 p-16 text-center text-zinc-500">
            We’re curating items for this season. Please check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
