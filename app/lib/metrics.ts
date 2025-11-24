import { requestJSON } from "@/app/lib/api";
import { MetricExpression, MetricSeries, MetricDescriptor, QueryScope } from "@/app/lib/types";

export type MetricQueryInput = {
  expression?: MetricExpression;
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

export async function describeMetrics() {
  const result = await requestJSON<{ metrics: MetricDescriptor[] }>("/metrics/describe", {
    method: "POST",
    body: JSON.stringify({}),
  });
  // Extract the metrics array from the response object
  return result?.metrics || [];
}
