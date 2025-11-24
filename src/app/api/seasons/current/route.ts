import { NextResponse } from "next/server";
import { getCurrentSeason } from "@/lib/seasons";

export async function GET() {
  const season = await getCurrentSeason();

  return NextResponse.json({ season });
}
