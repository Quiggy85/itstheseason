import type { SeasonalEventConfig } from "@/config/seasonal-events";
import type { CatalogEvent } from "@/lib/catalog/types";

interface SeasonalHeroProps {
  config: SeasonalEventConfig;
  event: CatalogEvent;
}

export function SeasonalHero({ config, event }: SeasonalHeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-transparent bg-gradient-to-br p-8 text-zinc-900 shadow-lg sm:p-12"
      style={{ background: config.hero.backgroundColor }}
    >
      <div className="absolute -top-24 -right-24 h-52 w-52 rotate-12 rounded-full bg-white/40 blur-3xl" aria-hidden />
      <div className="absolute -bottom-10 -left-16 h-64 w-64 -rotate-6 rounded-full bg-white/30 blur-3xl" aria-hidden />
      <div className="relative z-10 max-w-2xl space-y-5">
        <span
          className="inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wide"
          style={{ backgroundColor: `${config.hero.accentColor}18`, color: config.hero.accentColor }}
        >
          Now featuring · {config.name}
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {config.hero.headline}
        </h1>
        <p className="text-lg text-zinc-700 sm:text-xl">{config.hero.subheadline}</p>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-700">
          <p>
            <span className="font-semibold">Event window:</span> {event.start_date} &mdash; {event.end_date}
          </p>
          <p>
            <span className="font-semibold">Curated for UK delivery.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
