import { notFound } from "next/navigation";

import { getProductsForCurrentSeason } from "@/lib/products";
import { ProductClient } from "./ProductClient";

export default async function ProductPage({
  params,
}: {
  // In React 19/Next 16, params is a Promise in server components
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const { products } = await getProductsForCurrentSeason();

  const paramId = resolvedParams.id;

  console.log("ProductPage resolved paramId", paramId);
  console.log("ProductPage product ids", products.map((p) => p.id));

  const product = products.find((p) => p.id === paramId) ?? null;

  if (!product) {
    notFound();
  }

  const galleryImages = (
    product.avasam?.ProductImage && product.avasam.ProductImage.length > 0
      ? product.avasam.ProductImage
      : [
          product.image_url ||
            product.avasam?.Image ||
            "/placeholder.png",
        ]
  ).filter(Boolean) as string[];

  return <ProductClient product={product} />;
}
