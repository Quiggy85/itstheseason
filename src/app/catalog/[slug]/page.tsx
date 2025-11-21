import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

import { SeasonalHero } from "@/components/catalog/seasonal-hero";
import { ProductCard } from "@/components/catalog/product-card";
import { getSeasonalEventBySlug } from "@/config/seasonal-events";
import { fetchCatalogBySlug } from "@/lib/catalog/fetch-catalog";

const PAGE_SIZE = 24;

type CatalogPageProps = {
  params: {
    slug: string;
  };
  searchParams?: {
    page?: string;
  };
};

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const { slug } = params;
  const page = Number.parseInt(searchParams?.page ?? "1", 10);
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { data, error } = await fetchCatalogBySlug(slug, {
    limit: PAGE_SIZE,
    offset,
    requireUkShipping: true,
  });

  if (error?.status === 404) {
    notFound();
  }

  if (!data) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold text-zinc-900">Catalogue temporarily unavailable</h1>
        <p className="max-w-2xl text-base text-zinc-600">
          {error?.message ?? "We’re updating this collection. Please try again shortly."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Return home
        </Link>
      </div>
    );
  }

  const seasonalConfig = getSeasonalEventBySlug(data.event.slug);
  const hasMore = data.pagination.hasMore ?? data.products.length === PAGE_SIZE;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      {seasonalConfig ? (
        <SeasonalHero config={seasonalConfig} event={data.event} />
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-semibold text-zinc-900">{data.event.name}</h1>
          {data.event.description ? (
            <p className="mt-2 text-base text-zinc-600">{data.event.description}</p>
          ) : null}
        </div>
      )}

      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900">All items</h2>
            <p className="text-sm text-zinc-600">
              Showing {data.products.length} item{data.products.length === 1 ? "" : "s"} for this event.
            </p>
          </div>
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

        <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
          <span className="text-sm text-zinc-600">
            Page {currentPage}
          </span>
          <div className="flex items-center gap-3">
            <Link
              aria-disabled={currentPage <= 1}
              className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
              href={currentPage <= 1 ? `#` : `/catalog/${slug}?page=${currentPage - 1}`}
            >
              Previous
            </Link>
            <Link
              aria-disabled={!hasMore}
              className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
              href={!hasMore ? `#` : `/catalog/${slug}?page=${currentPage + 1}`}
            >
              Next
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
