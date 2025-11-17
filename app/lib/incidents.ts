import { requestJSON } from "@/app/lib/api";
import { Incident, TimelineEntry } from "@/app/lib/types";
import { QueryScope } from "@/app/lib/scope";

export async function fetchIncident(id: string) {
  return requestJSON<Incident>(`/incidents/${id}`);
}

export async function fetchIncidentTimeline(id: string) {
  return requestJSON<TimelineEntry[] | null>(`/incidents/${id}/timeline`);
}

export async function queryIncidents(scope?: QueryScope) {
  const body: Record<string, unknown> = {};
  if (scope && Object.keys(scope).length) body.scope = scope;
  return requestJSON<Incident[]>("/incidents/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
