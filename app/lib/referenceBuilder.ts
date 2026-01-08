import { LogReference, MetricReference, AlertQuery, IncidentQuery, DeploymentReference, QueryScope } from "./types";
import { encodeLogExpression, encodeMetricExpression, encodeAlertQuery, encodeIncidentQuery, encodeDeploymentQuery } from "./utils";

/**
 * Builds a URL href for a tool execution based on tool name and arguments.
 * Maps tool executions to their corresponding Console views.
 * Returns null for unknown tools.
 */
export function buildToolExecutionHref(
  toolName: string,
  args: Record<string, unknown>
): string | null {
  switch (toolName) {
    case "query-incidents":
      return buildIncidentHref(args as Partial<IncidentQuery>);

    case "get-incident":
      // Tool uses 'id' not 'incidentId'
      if (args.id) {
        return `/incidents/${args.id}`;
      }
      if (args.incidentId) {
        return `/incidents/${args.incidentId}`;
      }
      return "/incidents";

    case "query-alerts":
      return buildAlertHref(args as Partial<AlertQuery>);

    case "get-alert":
      if (args.id) {
        return `/alerts/${args.id}`;
      }
      if (args.alertId) {
        return `/alerts/${args.alertId}`;
      }
      return "/alerts";

    case "query-logs":
      // Handle expression as object with search field
      const logExpression = args.expression as Record<string, unknown> | undefined;
      return buildLogHref({
        expression: {
          search: logExpression?.search as string || args.query as string,
          filters: logExpression?.filters as LogReference["expression"]["filters"],
          severityIn: logExpression?.severityIn as string[],
        },
        start: args.start as string,
        end: args.end as string,
        scope: args.scope as QueryScope,
      });

    case "query-metrics":
      // Handle expression as object with metricName field
      const metricExpression = args.expression as Record<string, unknown> | undefined;
      return buildMetricHref({
        expression: typeof metricExpression === 'object' ? {
          metricName: metricExpression?.metricName as string || '',
          aggregation: metricExpression?.aggregation as string,
          filters: metricExpression?.filters as MetricReference["expression"]["filters"],
          groupBy: metricExpression?.groupBy as string[],
        } : { metricName: String(args.expression || '') },
        start: args.start as string,
        end: args.end as string,
        step: args.step as number,
        scope: args.scope as QueryScope,
      });

    case "describe-metrics":
      // describe-metrics returns metric descriptors, link to metrics view with scope
      if (args.scope) {
        const scope = args.scope as QueryScope;
        if (scope.service) {
          return `/metrics?scope=${encodeURIComponent(JSON.stringify(scope))}`;
        }
      }
      return "/metrics";

    case "query-services":
      return "/services";

    case "get-service":
      if (args.id) {
        return `/services/${args.id}`;
      }
      if (args.serviceId) {
        return `/services/${args.serviceId}`;
      }
      return "/services";

    case "query-tickets":
      return "/tickets";

    case "get-ticket":
      if (args.id) {
        return `/tickets?ticketId=${args.id}`;
      }
      if (args.ticketId) {
        return `/tickets?ticketId=${args.ticketId}`;
      }
      return "/tickets";

    case "query-deployments":
      return buildDeploymentHref({ query: args as DeploymentReference["query"] });

    case "get-deployment":
      if (args.id) {
        return `/deployments/${args.id}`;
      }
      if (args.deploymentId) {
        return `/deployments/${args.deploymentId}`;
      }
      return "/deployments";

    case "get-incident-timeline":
      // Tool uses 'id' not 'incidentId'
      if (args.id) {
        return `/incidents/${args.id}?tab=timeline`;
      }
      if (args.incidentId) {
        return `/incidents/${args.incidentId}?tab=timeline`;
      }
      return "/incidents";

    case "query-orchestration-plans":
      // Link to orchestration plans list, optionally with query params
      const planParams = new URLSearchParams();
      if (args.query) planParams.set("query", String(args.query));
      if (args.scope) planParams.set("scope", JSON.stringify(args.scope));
      const planQueryStr = planParams.toString();
      return planQueryStr ? `/orchestration/plans?${planQueryStr}` : "/orchestration/plans";

    case "get-orchestration-plan":
      if (args.id) {
        return `/orchestration/plans/${args.id}`;
      }
      if (args.planId) {
        return `/orchestration/plans/${args.planId}`;
      }
      return "/orchestration/plans";

    case "query-orchestration-runs":
      // Link to orchestration runs list
      const runParams = new URLSearchParams();
      if (args.planIds && Array.isArray(args.planIds)) {
        runParams.set("planIds", args.planIds.join(","));
      }
      if (args.statuses && Array.isArray(args.statuses)) {
        runParams.set("statuses", args.statuses.join(","));
      }
      const runQueryStr = runParams.toString();
      return runQueryStr ? `/orchestration/runs?${runQueryStr}` : "/orchestration/runs";

    case "get-orchestration-run":
      if (args.id) {
        return `/orchestration/runs/${args.id}`;
      }
      if (args.runId) {
        return `/orchestration/runs/${args.runId}`;
      }
      return "/orchestration/runs";

    case "start-orchestration-run":
      if (args.planId) {
        return `/orchestration/plans/${args.planId}`;
      }
      return "/orchestration/plans";

    case "complete-orchestration-step":
      if (args.runId) {
        return `/orchestration/runs/${args.runId}`;
      }
      return "/orchestration/runs";

    default:
      return null; // Unknown tool - no Console link
  }
}

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

/**
 * Builds a URL href for an alert query with all query parameters
 */
export function buildAlertHref(query: Partial<AlertQuery>): string {
  const params = new URLSearchParams();

  const encoded = encodeAlertQuery(query);
  Object.entries(encoded).forEach(([key, value]) => {
    params.set(key, value);
  });

  // Add scope if present
  if (query.scope) {
    const scopeStr = typeof query.scope === 'string' ? query.scope : JSON.stringify(query.scope);
    params.set("scope", scopeStr);
  }

  const queryStr = params.toString();
  return queryStr ? `/alerts?${queryStr}` : "/alerts";
}

/**
 * Builds a URL href for an incident query with all query parameters
 */
export function buildIncidentHref(query: Partial<IncidentQuery>): string {
  const params = new URLSearchParams();

  const encoded = encodeIncidentQuery(query);
  Object.entries(encoded).forEach(([key, value]) => {
    params.set(key, value);
  });

  // Add scope if present
  if (query.scope) {
    const scopeStr = typeof query.scope === 'string' ? query.scope : JSON.stringify(query.scope);
    params.set("scope", scopeStr);
  }

  const queryStr = params.toString();
  return queryStr ? `/incidents?${queryStr}` : "/incidents";
}

/**
 * Builds a URL href for a deployment reference with all query parameters
 */
export function buildDeploymentHref(reference: DeploymentReference | string): string {
  // Handle null/undefined references
  if (!reference) {
    return "/deployments";
  }

  // Handle string deployment ID
  if (typeof reference === 'string') {
    // Handle empty strings
    if (!reference.trim()) {
      return "/deployments";
    }
    return `/deployments/${reference}`;
  }

  // Handle deployment ID in reference object
  if (reference.deploymentId) {
    return `/deployments/${reference.deploymentId}`;
  }

  // Handle query-based reference
  const params = new URLSearchParams();

  if (reference.query) {
    const encoded = encodeDeploymentQuery(reference.query);
    Object.entries(encoded).forEach(([key, value]) => {
      params.set(key, value);
    });

    // Add scope if present
    if (reference.query.scope) {
      const scopeStr = typeof reference.query.scope === 'string' ? reference.query.scope : JSON.stringify(reference.query.scope);
      params.set("scope", scopeStr);
    }
  }

  const queryStr = params.toString();
  return queryStr ? `/deployments?${queryStr}` : "/deployments";
}