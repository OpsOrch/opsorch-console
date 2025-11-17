import { Incident, Service, Ticket } from "@/app/lib/types";

export type QueryScope = {
  service?: string;
  environment?: string;
  team?: string;
};

const pickString = (obj: Record<string, unknown> | undefined, key: string) => {
  const value = obj?.[key];
  return typeof value === "string" ? value : "";
};

export function buildScopeFromIncident(incident: Incident | null, overrides?: QueryScope) {
  const scope: QueryScope = {};
  const serviceVal = overrides?.service || incident?.service || pickString(incident?.fields, "service") || pickString(incident?.metadata, "service");
  const envVal = overrides?.environment || pickString(incident?.fields, "environment") || pickString(incident?.fields, "env") || pickString(incident?.metadata, "environment" ) || pickString(incident?.metadata, "env");
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
