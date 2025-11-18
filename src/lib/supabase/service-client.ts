import "server-only";

import { createClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

let serviceClient:
  | ReturnType<typeof createClient<Database>>
  | undefined;

export function getSupabaseServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient<Database>(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }
  return serviceClient;
}
