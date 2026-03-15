import React, { useState } from "react";
import { CopilotReferences, DeploymentQuery, DeploymentReference } from "@/app/lib/types";
import { buildLogHref, buildMetricHref, buildAlertHref, buildIncidentHref, buildDeploymentHref } from "@/app/lib/referenceBuilder";

export function ReferenceLinks({
    references,
}: {
    references?: CopilotReferences;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    console.log('[ReferenceLinks] Received references:', references);
    if (!references) {
        console.log('[ReferenceLinks] No references provided');
        return null;
    }
    const { incidents, alerts, services, metrics, logs, tickets, deployments, teams, orchestrationPlans } = references;
    console.log('[ReferenceLinks] Extracted:', { incidents, alerts, services, metrics, logs, tickets, deployments, teams, orchestrationPlans });
    if (!incidents?.length && !alerts?.length && !services?.length && !metrics?.length && !logs?.length && !tickets?.length && !deployments?.length && !teams?.length && !orchestrationPlans?.length) {
        console.log('[ReferenceLinks] All reference arrays are empty');
        return null;
    }

    const renderList = (items: React.ReactNode[]) => (
        <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {items.map((node, idx) => (
                <li key={idx}>{node}</li>
            ))}
        </ul>
    );

    const totalReferences =
        (incidents?.length || 0) +
        (alerts?.length || 0) +
        (services?.length || 0) +
        (metrics?.length || 0) +
        (logs?.length || 0) +
        (tickets?.length || 0) +
        (deployments?.length || 0) +
        (teams?.length || 0) +
        (orchestrationPlans?.length || 0);

    return (
        <div className="space-y-2 text-xs text-slate-700">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between text-left"
                type="button"
            >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    References ({totalReferences})
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                        {totalReferences} total
                    </span>
                    <svg
                        className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            {isExpanded && incidents?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Incidents</p>
                    {renderList(incidents.map((inc, idx) => {
                        const isString = typeof inc === 'string';
                        const href = isString ? `/incidents/${inc}` : buildIncidentHref(inc);
                        const label = isString ? `Incident ${inc}` : inc.query || 'Incident Query';
                        return (
                            <a
                                key={`inc-${idx}`}
                                href={href}
                                className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {label}
                            </a>
                        );
                    }))}
                </div>
            ) : null}
            {isExpanded && alerts?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Alerts</p>
                    {renderList(alerts.map((alert, idx) => {
                        const isString = typeof alert === 'string';
                        const href = isString ? `/alerts/${alert}` : buildAlertHref(alert);
                        const label = isString ? alert : alert.query || 'Alert Query';
                        return (
                            <a
                                key={`alert-${idx}`}
                                href={href}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {label}
                            </a>
                        );
                    }))}
                </div>
            ) : null}
            {isExpanded && deployments?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Deployments</p>
                    {renderList(deployments.map((deployment, idx) => {
                        const isString = typeof deployment === 'string';
                        let href: string;
                        let label: string;

                        if (isString) {
                            // String deployment ID
                            href = buildDeploymentHref(deployment);
                            label = `Deployment ${deployment}`;
                        } else if ('deploymentId' in deployment && deployment.deploymentId) {
                            // DeploymentReference with ID
                            href = buildDeploymentHref(deployment);
                            label = `Deployment ${deployment.deploymentId}`;
                        } else if ('query' in deployment && deployment.query && typeof deployment.query === 'object') {
                            // DeploymentReference with query object
                            href = buildDeploymentHref(deployment as DeploymentReference);
                            label = deployment.query.query || 'Deployment Query';
                        } else {
                            // Partial DeploymentQuery (treat as query object)
                            href = buildDeploymentHref({ query: deployment as DeploymentQuery });
                            label = (deployment as DeploymentQuery).query || 'Deployment Query';
                        }

                        return (
                            <a
                                key={`deployment-${idx}`}
                                href={href}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                {label}
                            </a>
                        );
                    }))}
                </div>
            ) : null}
            {isExpanded && services?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Services</p>
                    {renderList(services.map((svc) => (
                        <a
                            key={`svc-${svc}`}
                            href={`/services/${svc}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                            {svc}
                        </a>
                    )))}
                </div>
            ) : null}
            {isExpanded && teams?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Teams</p>
                    {renderList(teams.map((team: string) => (
                        <a
                            key={`team-${team}`}
                            href={`/teams/${team}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {team}
                        </a>
                    )))}
                </div>
            ) : null}
            {isExpanded && tickets?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Tickets</p>
                    {renderList(
                        tickets.map((t) => {
                            const label = `${t}`;
                            const href = t ? `/tickets?ticketId=${encodeURIComponent(t)}` : "/tickets";
                            return (
                                <a
                                    key={`ticket-${t}`}
                                    href={href}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                                    title="Open in tickets"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                    </svg>
                                    {label}
                                </a>
                            );
                        }),
                    )}
                </div>
            ) : null}
            {isExpanded && metrics?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Metrics</p>
                    {renderList(
                        metrics.map((m, idx) => {
                            // Handle both object format { metricName: "..." } and string format "metric_name{...}"
                            const content = typeof m.expression === 'object' && m.expression?.metricName
                                ? m.expression.metricName
                                : typeof m.expression === 'string'
                                    ? m.expression
                                    : "(unnamed)";
                            const tooltip = `${m.start || "?"} → ${m.end || "?"}${m.scope ? ` • Scope: ${JSON.stringify(m.scope)}` : ""}`;
                            return (
                                <a
                                    key={`metric-${idx}`}
                                    href={buildMetricHref(m)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                                    title={`Open in metrics • ${tooltip}`}
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    {content}
                                </a>
                            );
                        }),
                    )}
                </div>
            ) : null}
            {isExpanded && logs?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Logs</p>
                    {renderList(
                        logs.map((l, idx) => {
                            // Handle both expression.search (object) and query (string) formats
                            const content = l.expression?.search || "(unnamed)";
                            const tooltip = `${l.start || "?"} → ${l.end || "?"}${l.scope ? ` • Scope: ${JSON.stringify(l.scope)}` : ""}`;
                            return (
                                <a
                                    key={`log-${idx}`}
                                    href={buildLogHref(l)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                                    title={`Open in logs • ${tooltip}`}
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {content}
                                </a>
                            );
                        }),
                    )}
                </div>
            ) : null}
            {isExpanded && orchestrationPlans?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Orchestration Plans</p>
                    {renderList(orchestrationPlans.map((planId: string) => (
                        <a
                            key={`plan-${planId}`}
                            href={`/orchestration/plans/${planId}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                            {planId}
                        </a>
                    )))}
                </div>
            ) : null}
        </div>
    );
}
