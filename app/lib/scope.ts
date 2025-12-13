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
    // Try JSON parsing first
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as QueryScope;
      }
    } catch {
      // ignore invalid json, try key:value format
    }
    
    // Parse key:value,key:value format (e.g., "service:svc-checkout,environment:staging")
    try {
      const scope: QueryScope = {};
      const pairs = value.split(',');
      for (const pair of pairs) {
        const [key, val] = pair.split(':');
        if (key && val) {
          const trimmedKey = key.trim();
          const trimmedVal = val.trim();
          if (trimmedKey === 'service') scope.service = trimmedVal;
          else if (trimmedKey === 'environment') scope.environment = trimmedVal;
          else if (trimmedKey === 'team') scope.team = trimmedVal;
        }
      }
      if (scope.service || scope.environment || scope.team) return scope;
    } catch {
      // ignore parsing errors
    }
  }
  return undefined;
}

export function serializeScope(scope?: QueryScope): string {
  if (!scope) return "";
  
  // Use user-friendly key:value format for URLs
  const parts: string[] = [];
  if (scope.service) parts.push(`service:${scope.service}`);
  if (scope.environment) parts.push(`environment:${scope.environment}`);
  if (scope.team) parts.push(`team:${scope.team}`);
  
  return parts.length > 0 ? parts.join(',') : "";
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
