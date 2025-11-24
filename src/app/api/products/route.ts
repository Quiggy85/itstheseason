import { NextResponse } from "next/server";
import { getProductsForCurrentSeason } from "@/lib/products";

export async function GET() {
  try {
    const { season, products } = await getProductsForCurrentSeason();

    return NextResponse.json({ season, products });
  } catch (error) {
    console.error("Error in /api/products", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}
