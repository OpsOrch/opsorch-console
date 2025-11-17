import { requestJSON } from "@/app/lib/api";
import { Ticket } from "@/app/lib/types";
import { QueryScope } from "@/app/lib/scope";

export async function fetchTicket(id: string) {
  return requestJSON<Ticket>(`/tickets/${id}`);
}

export function queryTickets(scope?: QueryScope) {
  const body: Record<string, unknown> = {};
  if (scope && Object.keys(scope).length) body.scope = scope;
  return requestJSON<Ticket[]>("/tickets/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
