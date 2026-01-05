"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { requestJSON } from "@/app/lib/api";
import { Alert } from "@/app/lib/types";
import { Pill } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";

export default function AlertDetailPage() {
    const params = useParams<{ id?: string }>();
    const alertId = useMemo(() => {
        const raw = params?.id;
        return Array.isArray(raw) ? raw[0] : raw;
    }, [params]);

    const [alert, setAlert] = useState<Alert | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAlert = useCallback(async () => {
        if (!alertId) return;
        setLoading(true);
        setError(null);
        try {
            // TODO: Replace with actual endpoint
            const res = await requestJSON<Alert>(`/alerts/${alertId}`);
            setAlert(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, [alertId]);

    useEffect(() => {
        loadAlert();
    }, [loadAlert]);

    const hero = alert ? (
        <div className="flex items-center gap-3">
            <Pill
                label={alert.severity}
                tone={
                    ["critical", "error", "P1"].includes(alert.severity) ? "error" :
                        ["warning", "warn"].includes(alert.severity) ? "warn" : "default"
                }
            />
            <span className="text-xs uppercase tracking-[0.2em] text-[#3d8f92]">{alert.id}</span>
        </div>
    ) : (
        "Alert"
    );

    return (
        <AppShell
            title={alert?.title || "Alert detail"}
            description="Detailed view of the alert and its metadata."
            hero={hero}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Link href="/alerts" className="text-xs font-semibold text-[#0b1517] underline-offset-4 hover:underline">
                        Back to all alerts
                    </Link>
                    <Pill
                        label={alert?.status || "loading"}
                        tone={
                            ["firing", "open"].includes(alert?.status || "") ? "error" :
                                ["resolved", "closed"].includes(alert?.status || "") ? "success" : "default"
                        }
                    />
                    {alert?.service ? <Pill label={`svc:${alert.service}`} /> : null}
                    {error ? <Pill label={error} tone="error" /> : null}
                    {alert?.url ? (
                        <a
                        href={alert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#8fdede] bg-white px-2 py-1 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:text-[#0b1517]"
                        >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in Tool
                        </a>
                    ) : null}
                    <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {alert ? (
                            <>
                                <span>Created {formatDate(alert.createdAt)}</span>
                                <span>Updated {formatDate(alert.updatedAt)}</span>
                            </>
                        ) : null}
                        <button
                            type="button"
                            onClick={loadAlert}
                            className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {alert ? (
                    <div className="grid gap-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-2 text-sm font-semibold text-slate-900">Description</h3>
                            <p className="text-slate-700">{alert.description || "No description provided."}</p>
                        </div>

                        {alert.fields && Object.keys(alert.fields).length > 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-sm font-semibold text-slate-900">Fields</h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(alert.fields).map(([key, value]) => (
                                        <div key={key} className="flex flex-col gap-1">
                                            <span className="text-xs font-medium uppercase text-slate-500">{key}</span>
                                            <span className="text-sm text-slate-800 break-words">
                                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {alert.metadata && Object.keys(alert.metadata).length > 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-sm font-semibold text-slate-900">Metadata</h3>
                                <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
                                    {JSON.stringify(alert.metadata, null, 2)}
                                </pre>
                            </div>
                        ) : null}
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#55cfd0]" />
                    </div>
                ) : null}
            </div>
        </AppShell>
    );
}
