import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertQuery } from "@/app/lib/types";
import { queryAlerts } from "@/app/lib/alerts";
import { Badge, Field, Section, TextInput } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";
import { DEFAULT_QUERY_LIMIT } from "@/app/lib/consts";
import { useAsyncState, useIntegrations } from "@/app/lib/hooks";
import { ScopeInputs } from "@/app/components/ScopeInputs";
import { EmptyState } from "@/app/components/EmptyState";

type AlertsPanelProps = {
    initialQuery?: Partial<AlertQuery>;
    readOnly?: boolean;
};

const DEFAULT_QUERY: Partial<AlertQuery> = {
    limit: DEFAULT_QUERY_LIMIT,
};

export function AlertsPanel({ initialQuery, readOnly = false }: AlertsPanelProps = {}) {
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const alertState = useAsyncState();
    const { start, succeed, fail } = alertState;
    const { hasIntegrations, loading: integrationsLoading } = useIntegrations();
    const [showAdvanced, setShowAdvanced] = useState(Boolean(initialQuery?.scope || initialQuery?.statuses || initialQuery?.severities));

    const [alertQuery, setAlertQuery] = useState<Partial<AlertQuery>>(() => ({
        query: initialQuery?.query || "",
        statuses: initialQuery?.statuses,
        severities: initialQuery?.severities,
        scope: initialQuery?.scope,
        limit: initialQuery?.limit || DEFAULT_QUERY_LIMIT,
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

    const resetToDefaults = () => {
        setAlertQuery(DEFAULT_QUERY);
        setStatusesInput("");
        setSeveritiesInput("");
        executeQuery(DEFAULT_QUERY);
    };

    const isDefaultQuery = () => {
        return (
            !alertQuery.query &&
            !statusesInput &&
            !severitiesInput &&
            !alertQuery.scope &&
            alertQuery.limit === DEFAULT_QUERY_LIMIT
        );
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            executeQuery(alertQuery);
        }, 0);
        return () => clearTimeout(timer);
    }, [alertQuery, executeQuery]);

    return (
        <Section
            title={readOnly ? "Alerts" : "Search"}
            description={readOnly ? undefined : "Query alerts by status, severity, and scope."}
            action={
                <div className="flex gap-2">
                    {!readOnly && !isDefaultQuery() && (
                        <button
                            type="button"
                            onClick={resetToDefaults}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Reset to Default
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={runQuery}
                        className={
                            !readOnly
                                ? "rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
                                : "rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-medium text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0] hover:text-[#0b1517]"
                        }
                    >
                        {!readOnly ? "Run query" : "Refresh"}
                    </button>
                </div>
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
                                placeholder="20"
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
                        <EmptyState
                            title="Error loading alerts"
                            description={alertState.error}
                            variant="error"
                            action={{ label: "Retry", onClick: runQuery }}
                        />
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

                <div className="flex flex-col gap-3 max-h-[40rem] xl:max-h-[50rem] 2xl:max-h-[60rem] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {(alertState.loading || integrationsLoading) && alerts.length === 0 ? (
                        <>
                            {Array.from({ length: 9 }).map((_, i) => (
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
                        </>
                    ) : !hasIntegrations ? (
                        <EmptyState
                            title="No integration configured"
                            description="Connect an integration to start monitoring alerts."
                            variant="no-integration"
                            action={{ label: "Configure Integration", onClick: () => router.push("/settings") }}
                        />
                    ) : alerts.length === 0 ? (
                        <EmptyState
                            title={readOnly ? "No alerts" : isDefaultQuery() ? "No alerts found" : "No matching alerts"}
                            description={readOnly ? "Everything looks good!" : isDefaultQuery() ? "There are no alerts in the system currently." : "Try adjusting your search filters or resetting to default."}
                            variant={readOnly ? "default" : "no-data"}
                            action={!readOnly && !isDefaultQuery() ? { label: "Reset to Default", onClick: resetToDefaults } : { label: "Refresh", onClick: runQuery }}
                        />
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
