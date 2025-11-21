import React from "react";
import { CopilotReferences } from "@/app/lib/types";

// Helper functions for building reference URLs
import { QueryScope } from "@/app/lib/types";

function buildMetricHref(m: { expression: string; start?: string; end?: string; scope?: QueryScope }) {
    const params = new URLSearchParams();
    params.set("expression", m.expression);
    if (m.start) params.set("start", m.start);
    if (m.end) params.set("end", m.end);
    if (m.scope) params.set("scope", JSON.stringify(m.scope));
    const query = params.toString();
    return query ? `/metrics?${query}` : "/metrics";
}

function buildLogHref(l: { query: string; start?: string; end?: string; service?: string; scope?: QueryScope }) {
    const params = new URLSearchParams();
    params.set("query", l.query);
    if (l.start) params.set("start", l.start);
    if (l.end) params.set("end", l.end);
    if (l.service) params.set("service", l.service);
    if (l.scope) params.set("scope", JSON.stringify(l.scope));
    const query = params.toString();
    return query ? `/logs?${query}` : "/logs";
}

export function ReferenceLinks({
    references,
}: {
    references?: CopilotReferences;
}) {
    if (!references) return null;
    const { incidents, services, metrics, logs, tickets } = references;
    if (!incidents?.length && !services?.length && !metrics?.length && !logs?.length && !tickets?.length) return null;

    const renderList = (items: React.ReactNode[]) => (
        <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {items.map((node, idx) => (
                <li key={idx}>{node}</li>
            ))}
        </ul>
    );

    return (
        <div className="space-y-2 text-xs text-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">References</p>
            {incidents?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Incidents</p>
                    {renderList(incidents.map((id) => (
                        <a
                            key={`inc-${id}`}
                            href={`/incidents/${id}`}
                            className="group inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-100 hover:shadow"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Incident {id}
                        </a>
                    )))}
                </div>
            ) : null}
            {services?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Services</p>
                    {renderList(services.map((svc) => (
                        <a
                            key={`svc-${svc}`}
                            href={`/services`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-100 hover:shadow"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                            {svc}
                        </a>
                    )))}
                </div>
            ) : null}
            {tickets?.length ? (
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
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 font-semibold text-purple-700 shadow-sm transition-all hover:border-purple-300 hover:bg-purple-100 hover:shadow"
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
            {metrics?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Metrics</p>
                    {renderList(
                        metrics.map((m, idx) => {
                            const content = m.expression;
                            const tooltip = `${m.start || "?"} → ${m.end || "?"}${m.scope ? ` • Scope: ${JSON.stringify(m.scope)}` : ""}`;
                            return (
                                <a
                                    key={`metric-${idx}`}
                                    href={buildMetricHref(m)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 font-semibold text-teal-700 shadow-sm transition-all hover:border-teal-300 hover:bg-teal-100 hover:shadow"
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
            {logs?.length ? (
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Logs</p>
                    {renderList(
                        logs.map((l, idx) => {
                            const content = l.query;
                            const tooltip = `${l.start || "?"} → ${l.end || "?"}${l.scope ? ` • Scope: ${JSON.stringify(l.scope)}` : ""}`;
                            return (
                                <a
                                    key={`log-${idx}`}
                                    href={buildLogHref(l)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-200 hover:shadow"
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
        </div>
    );
}
