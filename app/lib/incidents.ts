import { requestJSON } from "@/app/lib/api";
import { Incident, TimelineEntry, IncidentQuery } from "@/app/lib/types";

export async function fetchIncident(id: string) {
  return requestJSON<Incident>(`/incidents/${id}`);
}

export async function fetchIncidentTimeline(id: string) {
  return requestJSON<TimelineEntry[] | null>(`/incidents/${id}/timeline`);
}

export async function queryIncidents(incidentQuery?: Partial<IncidentQuery>) {
  const body: IncidentQuery = {
    query: incidentQuery?.query,
    statuses: incidentQuery?.statuses,
    severities: incidentQuery?.severities,
    scope: incidentQuery?.scope,
    limit: incidentQuery?.limit,
    metadata: incidentQuery?.metadata,
  };

  // Remove undefined fields
  Object.keys(body).forEach(key => {
    if (body[key as keyof IncidentQuery] === undefined) {
      delete body[key as keyof IncidentQuery];
    }
  });

  return requestJSON<Incident[]>("/incidents/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
