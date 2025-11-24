import { LogReference, MetricReference } from "./types";
import { encodeLogExpression, encodeMetricExpression } from "./utils";

/**
 * Builds a URL href for a log reference with all query parameters
 */
export function buildLogHref(l: LogReference): string {
  const params = new URLSearchParams();

  // Encode the full expression
  if (l.expression) {
    const encodedExpr = encodeLogExpression(l.expression);
    Object.entries(encodedExpr).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  // Add time bounds
  if (l.start) params.set("start", l.start);
  if (l.end) params.set("end", l.end);

  // Add scope
  if (l.scope) {
    const scopeStr = typeof l.scope === 'string' ? l.scope : JSON.stringify(l.scope);
    params.set("scope", scopeStr);
  }

  const query = params.toString();
  return query ? `/logs?${query}` : "/logs";
}

/**
 * Builds a URL href for a metric reference with all query parameters
 */
export function buildMetricHref(m: MetricReference): string {
  const params = new URLSearchParams();

  // Encode the full expression
  if (typeof m.expression === 'object') {
    const encodedExpr = encodeMetricExpression(m.expression);
    Object.entries(encodedExpr).forEach(([key, value]) => {
      params.set(key, value);
    });
  } else if (typeof m.expression === 'string') {
    // Fallback for string format (backward compatibility)
    params.set("metricName", m.expression);
  }

  // Add time bounds
  if (m.start) params.set("start", m.start);
  if (m.end) params.set("end", m.end);
  if (m.step) params.set("step", m.step.toString());

  // Add scope
  if (m.scope) {
    const scopeStr = typeof m.scope === 'string' ? m.scope : JSON.stringify(m.scope);
    params.set("scope", scopeStr);
  }

  const query = params.toString();
  return query ? `/metrics?${query}` : "/metrics";
}
