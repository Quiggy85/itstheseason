import Stripe from "stripe";

import { serverEnv } from "@/lib/env.server";

let stripe: Stripe | undefined;

export function getStripeClient() {
  if (!stripe) {
    stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20" as Stripe.LatestApiVersion,
    });
  }
  return stripe;
}
