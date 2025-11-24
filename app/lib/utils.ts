import { LogExpression, MetricExpression, LogFilter, MetricFilter } from "./types";

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function stringify(obj?: Record<string, unknown>) {
  if (!obj || Object.keys(obj).length === 0) return null;
  return JSON.stringify(obj, null, 2);
}

export function parseJsonString(text?: unknown) {
  if (typeof text !== "string") return undefined;
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

export function stringifyData(data: unknown) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (err) {
    return `Unable to render data: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/**
 * Encodes a LogExpression to URL parameters
 */
export function encodeLogExpression(expression: LogExpression): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (expression.search) {
    params.search = expression.search;
  }
  
  if (expression.filters && expression.filters.length > 0) {
    params.filters = JSON.stringify(expression.filters);
  }
  
  if (expression.severityIn && expression.severityIn.length > 0) {
    params.severityIn = JSON.stringify(expression.severityIn);
  }
  
  return params;
}

/**
 * Decodes URL parameters to a LogExpression
 */
export function decodeLogExpression(params: URLSearchParams): LogExpression {
  const expression: LogExpression = {};
  
  const search = params.get('search');
  if (search) {
    expression.search = search;
  }
  
  const filters = params.get('filters');
  if (filters) {
    try {
      const parsed = JSON.parse(filters);
      if (Array.isArray(parsed)) {
        expression.filters = parsed as LogFilter[];
      }
    } catch {
      // Ignore invalid JSON
    }
  }
  
  const severityIn = params.get('severityIn');
  if (severityIn) {
    try {
      const parsed = JSON.parse(severityIn);
      if (Array.isArray(parsed)) {
        expression.severityIn = parsed as string[];
      }
    } catch {
      // Ignore invalid JSON
    }
  }
  
  return expression;
}

/**
 * Encodes a MetricExpression to URL parameters
 */
export function encodeMetricExpression(expression: MetricExpression): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (expression.metricName) {
    params.metricName = expression.metricName;
  }
  
  if (expression.aggregation) {
    params.aggregation = expression.aggregation;
  }
  
  if (expression.filters && expression.filters.length > 0) {
    params.filters = JSON.stringify(expression.filters);
  }
  
  if (expression.groupBy && expression.groupBy.length > 0) {
    params.groupBy = JSON.stringify(expression.groupBy);
  }
  
  return params;
}

/**
 * Decodes URL parameters to a MetricExpression
 */
export function decodeMetricExpression(params: URLSearchParams): MetricExpression {
  const metricName = params.get('metricName') || 'up';
  const expression: MetricExpression = { metricName };
  
  const aggregation = params.get('aggregation');
  if (aggregation) {
    expression.aggregation = aggregation;
  }
  
  const filters = params.get('filters');
  if (filters) {
    try {
      const parsed = JSON.parse(filters);
      if (Array.isArray(parsed)) {
        expression.filters = parsed as MetricFilter[];
      }
    } catch {
      // Ignore invalid JSON
    }
  }
  
  const groupBy = params.get('groupBy');
  if (groupBy) {
    try {
      const parsed = JSON.parse(groupBy);
      if (Array.isArray(parsed)) {
        expression.groupBy = parsed as string[];
      }
    } catch {
      // Ignore invalid JSON
    }
  }
  
  return expression;
}
