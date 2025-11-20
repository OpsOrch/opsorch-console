import { Incident, Service, Ticket, QueryScope } from "@/app/lib/types";

const pickString = (obj: Record<string, unknown> | undefined, key: string) => {
  const value = obj?.[key];
  return typeof value === "string" ? value : "";
};

export function buildScopeFromIncident(incident: Incident | null, overrides?: QueryScope) {
  const scope: QueryScope = {};
  const serviceVal = overrides?.service || incident?.service || pickString(incident?.fields, "service") || pickString(incident?.metadata, "service");
  const envVal = overrides?.environment || pickString(incident?.fields, "environment") || pickString(incident?.fields, "env") || pickString(incident?.metadata, "environment") || pickString(incident?.metadata, "env");
  const teamVal = overrides?.team || pickString(incident?.fields, "team") || pickString(incident?.metadata, "team");

  if (serviceVal) scope.service = serviceVal;
  if (envVal) scope.environment = envVal;
  if (teamVal) scope.team = teamVal;
  return scope;
}

export function buildScopeFromService(service: Service | null, overrides?: QueryScope) {
  const scope: QueryScope = {};
  const serviceVal = overrides?.service || service?.name || service?.id;
  const envVal = overrides?.environment || service?.tags?.environment || service?.tags?.env;
  const teamVal = overrides?.team || service?.tags?.team;

  if (serviceVal) scope.service = serviceVal;
  if (envVal) scope.environment = envVal;
  if (teamVal) scope.team = teamVal;
  return scope;
}

export function buildScopeFromTicket(ticket: Ticket | null, overrides?: QueryScope) {
  const scope: QueryScope = {};
  const serviceVal = overrides?.service || pickString(ticket?.fields, "service") || pickString(ticket?.metadata, "service");
  const envVal =
    overrides?.environment ||
    pickString(ticket?.fields, "environment") ||
    pickString(ticket?.fields, "env") ||
    pickString(ticket?.metadata, "environment") ||
    pickString(ticket?.metadata, "env");
  const teamVal = overrides?.team || pickString(ticket?.fields, "team") || pickString(ticket?.metadata, "team");

  if (serviceVal) scope.service = serviceVal;
  if (envVal) scope.environment = envVal;
  if (teamVal) scope.team = teamVal;
  return scope;
}

export function parseScope(value: unknown): QueryScope | undefined {
  if (!value) return undefined;
  if (typeof value === "object" && value !== null) {
    // Already an object, validate it has at least one known key
    const s = value as QueryScope;
    if (s.service || s.environment || s.team) return s;
    return undefined;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as QueryScope;
      }
    } catch {
      // ignore invalid json
    }
  }
  return undefined;
}

export function serializeScope(scope?: QueryScope): string {
  if (!scope) return "";
  return JSON.stringify(scope);
}

export function mergeScopes(...scopes: (QueryScope | undefined)[]): QueryScope {
  let result: QueryScope = {};
  for (const s of scopes) {
    if (s) {
      result = { ...result, ...s };
    }
  }
  return result;
}
