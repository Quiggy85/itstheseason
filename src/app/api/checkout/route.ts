import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getStripeClient } from "@/lib/stripe/client";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const supabase = await getSupabaseServerClient();

  try {
    const body = await request.json();
    const { items, successUrl, cancelUrl } = body as {
      items: Array<{ id: string; quantity: number }>;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!items?.length) {
      return NextResponse.json({ error: "Cart items required." }, { status: 400 });
    }

    // TODO: look up product pricing from Supabase cache.
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: `Product ${item.id}`,
        },
        unit_amount: 0,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Failed to create checkout session", error);
    return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
  }
}
