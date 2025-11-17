import { requestJSON } from "@/app/lib/api";
import { LogEntry } from "@/app/lib/types";
import { QueryScope } from "@/app/lib/scope";

export type LogQueryInput = {
  query?: string;
  start: string;
  end: string;
  limit?: number;
  scope?: QueryScope;
};

export function queryLogs(input: LogQueryInput) {
  return requestJSON<LogEntry[]>("/logs/query", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
