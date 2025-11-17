import assert from "node:assert";
import test from "node:test";
import { buildScopeFromIncident, buildScopeFromService } from "../app/lib/scope.ts";
import type { Incident, Service } from "../app/lib/types.ts";

const baseIncident: Incident = {
  id: "inc-1",
  title: "t",
  status: "open",
  severity: "sev3",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test("buildScopeFromIncident prefers overrides", () => {
  const inc: Incident = { ...baseIncident, service: "svc-a", fields: { environment: "prod" } };
  const scope = buildScopeFromIncident(inc, { service: "svc-b", environment: "stg", team: "core" });
  assert.deepEqual(scope, { service: "svc-b", environment: "stg", team: "core" });
});

test("buildScopeFromIncident falls back to fields/metadata", () => {
  const inc: Incident = { ...baseIncident, fields: { service: "svc-f", env: "dev" }, metadata: { team: "obs" } } as Incident;
  const scope = buildScopeFromIncident(inc);
  assert.deepEqual(scope, { service: "svc-f", environment: "dev", team: "obs" });
});

const baseService: Service = { id: "svc-1", name: "svc-1" };

test("buildScopeFromService uses overrides first", () => {
  const scope = buildScopeFromService(baseService, { service: "override", environment: "prod", team: "alpha" });
  assert.deepEqual(scope, { service: "override", environment: "prod", team: "alpha" });
});

test("buildScopeFromService uses service tags when overrides missing", () => {
  const svc: Service = { ...baseService, tags: { environment: "stg", team: "beta" } };
  const scope = buildScopeFromService(svc);
  assert.deepEqual(scope, { service: "svc-1", environment: "stg", team: "beta" });
});
