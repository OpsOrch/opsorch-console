import { requestJSON } from "@/app/lib/api";
import { MetricSeries, QueryScope } from "@/app/lib/types";

export type MetricQueryInput = {
  expression: string;
  start: string;
  end: string;
  step: number;
  scope?: QueryScope;
};

export function queryMetrics(input: MetricQueryInput) {
  return requestJSON<MetricSeries[]>("/metrics/query", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
