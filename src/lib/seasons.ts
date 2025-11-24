import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type Season = {
  id: string;
  slug: string;
  name: string;
  start_date: string;
  end_date: string;
  primary_color?: string | null;
  accent_color?: string | null;
};

export async function getCurrentSeason(): Promise<Season | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("seasons")
    .select("id, slug, name, start_date, end_date, primary_color, accent_color")
    .lte("start_date", new Date().toISOString())
    .gte("end_date", new Date().toISOString())
    .eq("is_active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching current season", error.message);
    return null;
  }

  return data as Season | null;
}
