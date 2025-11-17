export function trimTrailingSlash(url: string) {
  return url.endsWith("/") ? url.replace(/\/+$/, "") : url;
}

export function getApiBaseUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_OPS_ORCH_API_BASE_URL ||
    process.env.NEXT_PUBLIC_OPSORCH_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;
  return fromEnv ? trimTrailingSlash(fromEnv) : "";
}

export async function requestJSON<T>(path: string, init?: RequestInit) {
  const proxyPath = path.startsWith("/") ? `/api/proxy${path}` : `/api/proxy/${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };

  const res = await fetch(proxyPath, {
    cache: "no-store",
    ...init,
    headers,
  });
  const text = await res.text();
  if (!res.ok) {
    const msg = text || res.statusText;
    throw new Error(msg);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}
