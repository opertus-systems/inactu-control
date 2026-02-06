import { createControlApiToken } from "./control-api-auth";

function controlApiBaseUrl(): string {
  const value = process.env.INACTU_API_BASE_URL ?? process.env.NEXT_PUBLIC_INACTU_API_BASE_URL;
  if (!value) {
    throw new Error("INACTU_API_BASE_URL or NEXT_PUBLIC_INACTU_API_BASE_URL is required.");
  }
  return value.replace(/\/+$/, "");
}

export async function controlApiFetch(path: string, userId: string, init?: RequestInit): Promise<Response> {
  const token = await createControlApiToken(userId);
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }

  return fetch(`${controlApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}
