"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertQuery } from "@/app/lib/types";
import { queryAlerts } from "@/app/lib/alerts";
import { Badge, Field, Section, TextInput } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";
import { useAsyncState } from "@/app/lib/hooks";
import { ScopeInputs } from "@/app/components/ScopeInputs";

type AlertsPanelProps = {
    initialQuery?: Partial<AlertQuery>;
    readOnly?: boolean;
};

export function AlertsPanel({ initialQuery, readOnly = false }: AlertsPanelProps = {}) {
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const alertState = useAsyncState();
    const { start, succeed, fail } = alertState;
    const [showAdvanced, setShowAdvanced] = useState(Boolean(initialQuery?.scope || initialQuery?.statuses || initialQuery?.severities));

    const [alertQuery, setAlertQuery] = useState<Partial<AlertQuery>>(() => ({
        query: initialQuery?.query || "",
        statuses: initialQuery?.statuses,
        severities: initialQuery?.severities,
        scope: initialQuery?.scope,
        limit: initialQuery?.limit || 100,
    }));

    const [statusesInput, setStatusesInput] = useState(() => initialQuery?.statuses?.join(", ") || "");
    const [severitiesInput, setSeveritiesInput] = useState(() => initialQuery?.severities?.join(", ") || "");

    const executeQuery = useCallback(async (query: Partial<AlertQuery>) => {
        start();
        try {
            // Build the query with parsed arrays
            const queryPayload: Partial<AlertQuery> = {
                query: query.query || undefined,
                statuses: statusesInput ? statusesInput.split(",").map(s => s.trim()).filter(Boolean) : undefined,
                severities: severitiesInput ? severitiesInput.split(",").map(s => s.trim()).filter(Boolean) : undefined,
                scope: query.scope,
                limit: query.limit,
            };

            const res = await queryAlerts(queryPayload);
            setAlerts(res || []);
            succeed();
        } catch (err) {
            fail(err);
        }
    }, [start, succeed, fail, statusesInput, severitiesInput]);

    const runQuery = () => {
        executeQuery(alertQuery);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            executeQuery(alertQuery);
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Section
            title={readOnly ? "Alerts" : "Search"}
            description={readOnly ? undefined : "Query alerts by status, severity, and scope."}
            action={
                !readOnly ? (
                    <button
                        type="button"
                        onClick={runQuery}
                        className="rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
                    >
                        Run query
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={runQuery}
                        className="rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-medium text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0] hover:text-[#0b1517]"
                    >
                        Refresh
                    </button>
                )
            }
        >
            {!readOnly && (
                <>
                    <Field
                        label="Search"
                        input={
                            <TextInput
                                value={alertQuery.query || ""}
                                onChange={(v) => setAlertQuery((q) => ({ ...q, query: v }))}
                                placeholder="Search alert title or description"
                            />
                        }
                    />

                    <Field
                        label="Limit"
                        input={
                            <TextInput
                                value={String(alertQuery.limit || "")}
                                onChange={(v) => setAlertQuery((q) => ({ ...q, limit: v ? Number(v) : undefined }))}
                                placeholder="100"
                                type="number"
                            />
                        }
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            {showAdvanced ? "Hide" : "Show"} Advanced Options
                        </button>
                    </div>

                    {showAdvanced && (
                        <div className="space-y-4 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 shadow-sm">
                            <Field
                                label="Statuses (comma-separated)"
                                input={
                                    <TextInput
                                        value={statusesInput}
                                        onChange={setStatusesInput}
                                        placeholder="firing,resolved,open,closed"
                                    />
                                }
                            />

                            <Field
                                label="Severities (comma-separated)"
                                input={
                                    <TextInput
                                        value={severitiesInput}
                                        onChange={setSeveritiesInput}
                                        placeholder="critical,error,warning,info"
                                    />
                                }
                            />

                            <div className="border-t border-slate-200 pt-4">
                                <ScopeInputs
                                    scope={alertQuery.scope}
                                    onChange={(scope) => setAlertQuery((q) => ({ ...q, scope }))}
                                />
                            </div>
                        </div>
                    )}

                    {alertState.error ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                            Error loading alerts: {alertState.error}
                        </div>
                    ) : null}
                </>
            )}

            <div className="grid gap-3">
                {!readOnly && (
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold text-slate-700">Alert results</p>
                        <span className="text-xs text-slate-500">({alerts.length} found)</span>
                    </div>
                )}

                <div className="flex max-h-[40rem] flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {alertState.loading && alerts.length === 0 ? (
                        <div className="animate-fade-in space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white/80 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="h-5 w-48 rounded bg-slate-200" />
                                        <div className="flex gap-2">
                                            <div className="h-6 w-16 rounded-full bg-slate-200" />
                                            <div className="h-6 w-12 rounded-full bg-slate-200" />
                                        </div>
                                    </div>
                                    <div className="mt-2 h-3 w-32 rounded bg-slate-200" />
                                </div>
                            ))}
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="animate-fade-in rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-700">No alerts found</p>
                            <p className="mt-1 text-xs text-slate-500">{readOnly ? "Everything looks good!" : "Try adjusting your search criteria"}</p>
                        </div>
                    ) : (
                        alerts.map((alert) => {
                            const severityColors = {
                                critical: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-500" },
                                error: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-500" },
                                warning: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-500" },
                                info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500" },
                                default: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", icon: "text-slate-500" },
                            };

                            const sevKey = ["critical", "error", "P1"].includes(alert.severity) ? "critical" :
                                ["warning", "warn"].includes(alert.severity) ? "warning" :
                                    ["info"].includes(alert.severity) ? "info" : "default";

                            const colors = severityColors[sevKey as keyof typeof severityColors];

                            return (
                                <button
                                    key={alert.id}
                                    type="button"
                                    onClick={() => router.push(`/alerts/${alert.id}`)}
                                    className="animate-fade-in group flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[#55cfd0] hover:shadow-md"
                                >
                                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colors.bg}`}>
                                        <svg className={`h-5 w-5 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900 group-hover:text-[#0f5f66]">{alert.title}</p>
                                        {alert.description ? (
                                            <p className="text-xs text-slate-500 line-clamp-1">{alert.description}</p>
                                        ) : null}
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {alert.service ? <span className="font-medium text-slate-600">{alert.service} • </span> : null}
                                            Created {formatDate(alert.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            label={alert.status}
                                            variant={
                                                ["firing", "open"].includes(alert.status) ? "error" :
                                                    ["resolved", "closed"].includes(alert.status) ? "success" : "default"
                                            }
                                            size="sm"
                                        />
                                        <Badge
                                            label={alert.severity}
                                            variant={
                                                ["critical", "error", "P1"].includes(alert.severity) ? "error" :
                                                    ["warning", "warn"].includes(alert.severity) ? "warning" : "default"
                                            }
                                            size="sm"
                                        />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </Section>
    );
}
