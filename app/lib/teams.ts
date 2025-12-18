import { requestJSON } from "@/app/lib/api";
import { Team, TeamMember, TeamQuery } from "@/app/lib/types";

export async function queryTeams(query?: Partial<TeamQuery>) {
  const body: Record<string, unknown> = {};
  if (query?.name) body.name = query.name;
  if (query?.tags) body.tags = query.tags;
  if (query?.scope) body.scope = query.scope;
  if (query?.limit) body.limit = query.limit;
  if (query?.metadata) body.metadata = query.metadata;
  
  return requestJSON<Team[]>("/teams/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getTeam(id: string) {
  return requestJSON<Team>(`/teams/${encodeURIComponent(id)}`);
}

export async function getTeamMembers(id: string) {
  return requestJSON<TeamMember[]>(`/teams/${encodeURIComponent(id)}/members`);
}