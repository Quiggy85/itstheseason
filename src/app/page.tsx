import Link from "next/link";

import { getCurrentSeasonalEvent } from "@/config/seasonal-events";
import { ProductCard } from "@/components/catalog/product-card";
import { SeasonalHero } from "@/components/catalog/seasonal-hero";
import { fetchCatalogBySlug } from "@/lib/catalog/fetch-catalog";

export default async function Home() {
  const seasonalConfig = getCurrentSeasonalEvent();
  const { data, error } = await fetchCatalogBySlug(seasonalConfig.slug, {
    limit: 24,
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
    <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white">
      <div className="absolute inset-x-0 top-0 -z-10 flex justify-center blur-3xl">
        <div className="h-40 w-[32rem] bg-gradient-to-r from-sky-200/60 via-blue-100/50 to-rose-100/60" aria-hidden />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
        <SeasonalHero config={seasonalConfig} event={data.event} />

        <section className="rounded-3xl border border-sky-100 bg-white/60 px-6 py-4 text-sm font-medium text-sky-900 shadow-sm backdrop-blur">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 text-sky-800">
              <span className="text-lg">🎉</span>
              Fast US delivery on every seasonal pick this week only.
            </span>
            <Link
              href={`/catalog/${data.event.slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-sky-700"
            >
              Shop the full event
            </Link>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Featured arrivals</h2>
              <p className="text-sm text-zinc-600">
                Hand-picked finds refreshed daily for the current seasonal moment.
              </p>
            </div>
            <Link
              href={`/catalog/${data.event.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-200 hover:text-blue-700"
            >
              View full collection
              <span aria-hidden>→</span>
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

        <section className="grid gap-6 rounded-3xl bg-white/70 p-8 shadow-sm backdrop-blur sm:grid-cols-3">
          {[{
            title: "Seasonally curated",
            description: "Each collection is timed to US festivities with keywords that track the latest trends.",
            icon: "🗓️",
          }, {
            title: "Verified US delivery",
            description: "We vet suppliers for reliable shipping times and returns policies you can trust.",
            icon: "🚚",
          }, {
            title: "Hassle-free returns",
            description: "Each supplier provides a clear returns policy so you know exactly what to expect when ordering.",
            icon: "🔄",
          }].map((feature) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-zinc-100 bg-white/80 p-6 transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-md"
            >
              <span className="text-2xl" aria-hidden>
                {feature.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-8 text-white shadow-lg sm:p-12">
          <div className="absolute inset-y-0 right-0 -mr-12 hidden w-72 rounded-full bg-white/10 blur-3xl sm:block" aria-hidden />
          <div className="relative z-10 max-w-xl space-y-4">
            <h2 className="text-3xl font-semibold sm:text-4xl">Need help finding the perfect piece?</h2>
            <p className="text-sm sm:text-base text-blue-100">
              Tell us about your upcoming event and we’ll source a tailored set of US-ready products from the catalogue.
            </p>
            <Link
              href="/support/contact"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Talk to the team
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
