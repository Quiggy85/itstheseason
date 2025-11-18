"use client";

import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env.client";
import type { Database } from "@/types/database";

let browserClient:
  | ReturnType<typeof createBrowserClient<Database>>
  | undefined;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return browserClient;
}
