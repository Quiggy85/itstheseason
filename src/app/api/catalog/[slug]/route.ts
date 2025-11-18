import { NextResponse, type NextRequest } from "next/server";

import { searchCJProducts } from "@/lib/cj/service";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ error: "Missing seasonal event." }, { status: 400 });
  }

  const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);
  const offset = Number.parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10);
  const requireUkShipping = request.nextUrl.searchParams.get("requireUkShipping") !== "false";

  const supabase = await getSupabaseServerClient();
  const { data: event, error: eventError } = await supabase
    .from("seasonal_events")
    .select("id, name, slug, description, start_date, end_date")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Seasonal event not found." }, { status: 404 });
  }

  const { data: keywordsRows, error: keywordsError } = await supabase
    .from("seasonal_event_keywords")
    .select("keyword")
    .eq("event_id", event.id);

  if (keywordsError) {
    return NextResponse.json(
      { error: "Failed to load seasonal keywords." },
      { status: 500 },
    );
  }

  const keywords = (keywordsRows ?? []).map((row) => row.keyword).filter(Boolean);

  if (keywords.length === 0) {
    return NextResponse.json(
      { error: "Seasonal event has no keyword filters configured." },
      { status: 422 },
    );
  }

  try {
    const products = await searchCJProducts({
      keywords,
      limit,
      offset,
      requireUkShipping,
    });

    return NextResponse.json({
      event,
      products,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Failed to fetch CJ products", error);
    return NextResponse.json({ error: "Unable to load products." }, { status: 502 });
  }
}
