import Image from "next/image";
import Link from "next/link";
import { getProductsForCurrentSeason } from "@/lib/products";

export default async function Home() {
  const { season, products } = await getProductsForCurrentSeason();

  const primaryColor = season?.primary_color ?? "#6E2F8A";
  const accentColor = season?.accent_color ?? "#F8A300";

  const hasProducts = products.length > 0;

  return (
    <div className="space-y-8">
      <section
        className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r px-6 py-8 sm:px-10 sm:py-10 lg:flex lg:items-center lg:justify-between"
        style={{
          backgroundImage: `linear-gradient(120deg, ${primaryColor}, ${accentColor})`,
        }}
      >
        <div className="max-w-xl text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
            {season ? season.slug.replace("-", " ") : "current season"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {season ? season.name : "Seasonal picks for the UK"}
          </h1>
          <p className="mt-4 text-sm sm:text-base text-white/90">
            Handpicked products for this moment in the calendar, with UK-ready
            delivery and transparent pricing.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 font-medium backdrop-blur">
              UK only
            </span>
            <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1 font-medium backdrop-blur">
              Seasonal catalogue
            </span>
          </div>
        </div>
        <div className="mt-8 flex justify-end lg:mt-0">
          <div className="relative h-40 w-56 sm:h-48 sm:w-72">
            <div className="absolute inset-0 rounded-3xl bg-white/10 blur-3xl" />
            <div className="relative grid h-full w-full grid-cols-2 gap-2 rounded-3xl bg-white/10 p-2">
              <div className="flex flex-col gap-2">
                <div className="flex-1 rounded-2xl bg-white/80" />
                <div className="flex-1 rounded-2xl bg-white/60" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex-1 rounded-2xl bg-white/50" />
                <div className="flex-1 rounded-2xl bg-white/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {hasProducts ? "Seasonal highlights" : "No products for this season yet"}
          </h2>
          <p className="text-xs text-slate-500">
            Prices shown include your seasonal markup and are displayed in GBP.
          </p>
        </div>

        {!hasProducts && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            Once you link Avasam products to this season, they&#39;ll appear here
            automatically. Add product SKUs in Supabase and the API will take
            care of pricing and details.
          </div>
        )}

        {hasProducts && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const imageSrc =
                product.image_url ||
                product.avasam?.Image ||
                product.avasam?.ProductImage?.[0] ||
                "/placeholder.png";

              const price = product.price_with_markup ?? product.avasam?.Price;

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={imageSrc}
                      alt={product.name || product.avasam?.Title || "Product"}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-800 shadow-sm">
                      Seasonal pick
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                      {product.name || product.avasam?.Title}
                    </h3>
                    <p className="line-clamp-2 text-xs text-slate-500">
                      {product.description || product.avasam?.Description}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2 text-sm">
                      <div className="flex flex-col">
                        {price != null && (
                          <span className="font-semibold text-slate-900">
                            £{price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                        View details
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
