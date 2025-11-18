import crypto from "node:crypto";

import { serverEnv } from "@/lib/env.server";

import type { CJApiConfig } from "./types";

function getConfig(): CJApiConfig {
  return {
    baseUrl: serverEnv.CJ_API_BASE_URL,
    accessKey: serverEnv.CJ_API_ACCESS_KEY,
    secretKey: serverEnv.CJ_API_SECRET_KEY,
  };
}

function signRequest(path: string, timestamp: number, secretKey: string) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(`${path}${timestamp}`)
    .digest("hex");
}

export async function cjFetch<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const { baseUrl, accessKey, secretKey } = getConfig();
  const timestamp = Date.now();
  const signature = signRequest(path, timestamp, secretKey);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "CJ-API-ACCESS-KEY": accessKey,
      "CJ-API-TIMESTAMP": timestamp.toString(),
      "CJ-API-SIGNATURE": signature,
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
