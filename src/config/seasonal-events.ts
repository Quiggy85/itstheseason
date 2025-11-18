export type SeasonalEventConfig = {
  slug: string;
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  hero: {
    headline: string;
    subheadline: string;
    accentColor: string;
    backgroundColor: string;
  };
};

export const SEASONAL_EVENTS: SeasonalEventConfig[] = [
  {
    slug: "january-sales",
    name: "January Sales",
    startMonth: 1,
    startDay: 1,
    endMonth: 1,
    endDay: 31,
    hero: {
      headline: "Start the year with standout savings",
      subheadline: "Fresh finds for your resolutions and home refreshes.",
      accentColor: "#2563eb",
      backgroundColor: "linear-gradient(135deg, #e0f2fe, #f8fafc)",
    },
  },
  {
    slug: "valentines",
    name: "Valentine's Day",
    startMonth: 2,
    startDay: 1,
    endMonth: 2,
    endDay: 15,
    hero: {
      headline: "Love in every parcel",
      subheadline: "Gifts that say it all, delivered across the UK.",
      accentColor: "#ec4899",
      backgroundColor: "linear-gradient(135deg, #fff0f6, #ffe4e6)",
    },
  },
  {
    slug: "mothers-day",
    name: "Mother's Day",
    startMonth: 2,
    startDay: 20,
    endMonth: 3,
    endDay: 31,
    hero: {
      headline: "Thank mum with something thoughtful",
      subheadline: "Curated keepsakes and pampering treats she'll love.",
      accentColor: "#db2777",
      backgroundColor: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
    },
  },
  {
    slug: "easter",
    name: "Easter",
    startMonth: 3,
    startDay: 1,
    endMonth: 4,
    endDay: 15,
    hero: {
      headline: "Hop into spring",
      subheadline: "Bright décor and sweet surprises for the whole family.",
      accentColor: "#f97316",
      backgroundColor: "linear-gradient(135deg, #fff7ed, #fef3c7)",
    },
  },
  {
    slug: "fathers-day",
    name: "Father's Day",
    startMonth: 5,
    startDay: 20,
    endMonth: 6,
    endDay: 30,
    hero: {
      headline: "Top picks for top dads",
      subheadline: "From gadgets to grooming, discover gifts that impress.",
      accentColor: "#1d4ed8",
      backgroundColor: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    },
  },
  {
    slug: "halloween",
    name: "Halloween",
    startMonth: 10,
    startDay: 1,
    endMonth: 10,
    endDay: 31,
    hero: {
      headline: "Spooktacular season essentials",
      subheadline: "Costumes, décor, and treats ready for fright night.",
      accentColor: "#f97316",
      backgroundColor: "linear-gradient(135deg, #fff7ed, #fed7aa)",
    },
  },
  {
    slug: "black-friday",
    name: "Black Friday",
    startMonth: 11,
    startDay: 22,
    endMonth: 11,
    endDay: 30,
    hero: {
      headline: "Biggest deals of the season",
      subheadline: "Limited-time offers on must-have tech and home upgrades.",
      accentColor: "#111827",
      backgroundColor: "linear-gradient(135deg, #e5e7eb, #f3f4f6)",
    },
  },
  {
    slug: "cyber-monday",
    name: "Cyber Monday",
    startMonth: 12,
    startDay: 1,
    endMonth: 12,
    endDay: 5,
    hero: {
      headline: "Online exclusives continue",
      subheadline: "Snap up smart savings before they're gone.",
      accentColor: "#2563eb",
      backgroundColor: "linear-gradient(135deg, #eff6ff, #e0f2fe)",
    },
  },
  {
    slug: "christmas",
    name: "Christmas",
    startMonth: 11,
    startDay: 15,
    endMonth: 12,
    endDay: 26,
    hero: {
      headline: "Wrap up your wish list",
      subheadline: "Festive décor, gifting, and stocking fillers delivered",
      accentColor: "#b91c1c",
      backgroundColor: "linear-gradient(135deg, #fee2e2, #fef9c3)",
    },
  },
];

export function getCurrentSeasonalEvent(date = new Date()): SeasonalEventConfig {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const match = SEASONAL_EVENTS.find((event) => {
    const startsBefore =
      month > event.startMonth || (month === event.startMonth && day >= event.startDay);
    const endsAfter =
      month < event.endMonth || (month === event.endMonth && day <= event.endDay);
    return startsBefore && endsAfter;
  });

  return match ?? SEASONAL_EVENTS.find((event) => event.slug === "christmas")!;
}

export function getSeasonalEventBySlug(slug: string): SeasonalEventConfig | undefined {
  return SEASONAL_EVENTS.find((event) => event.slug === slug);
}
