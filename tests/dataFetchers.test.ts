import assert from "node:assert";
import test, { mock } from "node:test";
import { fetchIncident, fetchIncidentTimeline, queryIncidents } from "../app/lib/incidents.ts";
import { queryLogs } from "../app/lib/logs.ts";
import { queryMetrics } from "../app/lib/metrics.ts";
import { listServices, queryServices } from "../app/lib/services.ts";
import { queryTickets } from "../app/lib/tickets.ts";

test("fetchIncident requests by id", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(input, "/api/proxy/incidents/inc-123");
    assert.equal(init?.method, undefined);
    return { ok: true, text: async () => "{\"id\":\"inc-123\"}" } as Response;
  });
  const result = await fetchIncident("inc-123");
  assert.equal(result.id, "inc-123");
  fetchMock.mock.restore();
});

test("fetchIncidentTimeline fetches timeline path", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    assert.equal(input, "/api/proxy/incidents/inc-1/timeline");
    return { ok: true, text: async () => "[]" } as Response;
  });
  await fetchIncidentTimeline("inc-1");
  fetchMock.mock.restore();
});

test("queryIncidents includes scope only when present", async () => {
  const fetchWithScope = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(input, "/api/proxy/incidents/query");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { scope: { service: "svc-a" } });
    return { ok: true, text: async () => "[]" } as Response;
  });
  await queryIncidents({ service: "svc-a" });
  fetchWithScope.mock.restore();

  const fetchWithoutScope = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(input, "/api/proxy/incidents/query");
    assert.deepEqual(JSON.parse(String(init?.body)), {});
    return { ok: true, text: async () => "[]" } as Response;
  });
  await queryIncidents();
  fetchWithoutScope.mock.restore();
});

test("queryLogs posts the full input payload", async () => {
  const input = { query: "error", start: "s", end: "e", limit: 10, scope: { service: "svc" } };
  const fetchMock = mock.method(globalThis, "fetch", async (path: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(path, "/api/proxy/logs/query");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), input);
    return { ok: true, text: async () => "[]" } as Response;
  });
  await queryLogs(input);
  fetchMock.mock.restore();
});

test("queryMetrics posts metric expression and scope", async () => {
  const input = { expression: "sum(rate(http_requests))", start: "s", end: "e", step: 60, scope: { environment: "prod" } };
  const fetchMock = mock.method(globalThis, "fetch", async (path: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(path, "/api/proxy/metrics/query");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), input);
    return { ok: true, text: async () => "[]" } as Response;
  });
  await queryMetrics(input);
  fetchMock.mock.restore();
});

test("listServices requests services endpoint", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (path: RequestInfo | URL) => {
    assert.equal(path, "/api/proxy/services");
    return { ok: true, text: async () => "[]" } as Response;
  });
  await listServices();
  fetchMock.mock.restore();
});

test("queryServices includes name filter when provided", async () => {
  const fetchWithName = mock.method(globalThis, "fetch", async (path: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(path, "/api/proxy/services/query");
    assert.deepEqual(JSON.parse(String(init?.body)), { name: "svc" });
    return { ok: true, text: async () => "[]" } as Response;
  });
  await queryServices("svc");
  fetchWithName.mock.restore();

  const fetchWithoutName = mock.method(globalThis, "fetch", async (path: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(path, "/api/proxy/services/query");
    assert.deepEqual(JSON.parse(String(init?.body)), {});
    return { ok: true, text: async () => "[]" } as Response;
  });
  await queryServices();
  fetchWithoutName.mock.restore();
});

test("queryTickets posts scope when present", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (path: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(path, "/api/proxy/tickets/query");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { scope: { team: "sre" } });
    return { ok: true, text: async () => "[]" } as Response;
  });
  await queryTickets({ team: "sre" });
  fetchMock.mock.restore();
});
