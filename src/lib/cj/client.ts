import { serverEnv } from "@/lib/env.server";

function getConfig() {
  return {
    baseUrl: serverEnv.CJ_API_BASE_URL,
    accessToken: serverEnv.CJ_API_ACCESS_TOKEN,
  } as const;
}

export async function cjFetch<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const { baseUrl, accessToken } = getConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": accessToken,
      ...(init?.headers ?? {}),
    },
    signal: init?.signal,
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`CJ API error (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as TResponse;
}
