import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export async function getServerSession() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Failed to fetch Supabase session", error);
    return { session: null, user: null };
  }

  return { session, user: session?.user ?? null };
}

export async function requireUser(redirectTo?: string) {
  const { user } = await getServerSession();
  if (!user) {
    const target = redirectTo ?? "/";
    redirect(`/sign-in?redirect=${encodeURIComponent(target)}`);
  }
  return user;
}
