import { requestJSON } from "@/app/lib/api";
import { Service } from "@/app/lib/types";

export async function listServices() {
  return requestJSON<Service[]>("/services");
}

export async function queryServices(name?: string) {
  const body: Record<string, unknown> = {};
  if (name) body.name = name;
  return requestJSON<Service[]>("/services/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
