import { requestJSON } from "@/app/lib/api";
import { LogEntry, QueryScope } from "@/app/lib/types";

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
