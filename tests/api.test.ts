import assert from "node:assert";
import test, { mock } from "node:test";
import { getApiBaseUrl, requestJSON, trimTrailingSlash } from "../app/lib/api.js";

test("trimTrailingSlash removes final slash while preserving others", () => {
  assert.equal(trimTrailingSlash("https://example.com/"), "https://example.com");
  assert.equal(trimTrailingSlash("https://example.com/foo"), "https://example.com/foo");
  assert.equal(trimTrailingSlash("https://example.com/foo///"), "https://example.com/foo");
});

const envKeys = [
  "NEXT_PUBLIC_OPS_ORCH_API_BASE_URL",
  "NEXT_PUBLIC_OPSORCH_API_BASE_URL",
  "NEXT_PUBLIC_API_BASE_URL",
];

function restoreEnv(original: Record<string, string | undefined>) {
  for (const key of envKeys) {
    const value = original[key];
    if (typeof value === "undefined") delete process.env[key];
    else process.env[key] = value;
  }
}

test("getApiBaseUrl respects precedence and trims slashes", (t) => {
  const original: Record<string, string | undefined> = {};
  for (const key of envKeys) original[key] = process.env[key];

  process.env.NEXT_PUBLIC_OPS_ORCH_API_BASE_URL = "https://primary.example.com/";
  process.env.NEXT_PUBLIC_OPSORCH_API_BASE_URL = "https://secondary.example.com/";
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://fallback.example.com/";

  t.after(() => restoreEnv(original));
  assert.equal(getApiBaseUrl(), "https://primary.example.com");
});

test("getApiBaseUrl falls back and returns empty when unset", (t) => {
  const original: Record<string, string | undefined> = {};
  for (const key of envKeys) original[key] = process.env[key];

  delete process.env.NEXT_PUBLIC_OPS_ORCH_API_BASE_URL;
  delete process.env.NEXT_PUBLIC_OPSORCH_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://fallback.example.com/";

  t.after(() => restoreEnv(original));
  assert.equal(getApiBaseUrl(), "https://fallback.example.com");

  delete process.env.NEXT_PUBLIC_API_BASE_URL;
  assert.equal(getApiBaseUrl(), "");
});

test("requestJSON proxies requests, merges headers, and parses JSON", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(input, "/api/proxy/foo");
    assert.equal(init?.method, "POST");
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers["Content-Type"], "application/json");
    assert.equal(headers.Authorization, "Bearer token");
    return {
      ok: true,
      text: async () => "{\"ok\":true}",
    } as Response;
  });

  const payload = await requestJSON<{ ok: boolean }>("foo", {
    method: "POST",
    headers: { Authorization: "Bearer token" },
  });
  assert.deepEqual(payload, { ok: true });
  fetchMock.mock.restore();
});

test("requestJSON throws with response body or status text", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    return { ok: false, statusText: "Bad Request", text: async () => "boom" } as Response;
  });
  await assert.rejects(() => requestJSON("/bad"), /boom/);
  fetchMock.mock.restore();
});

test("requestJSON returns empty object when no body is present", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    return { ok: true, text: async () => "" } as Response;
  });
  const data = await requestJSON<Record<string, never>>("/empty");
  assert.deepEqual(data, {});
  fetchMock.mock.restore();
});
