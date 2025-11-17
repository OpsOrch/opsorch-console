"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { requestJSON } from "@/app/lib/api";
import { queryIncidents } from "@/app/lib/incidents";
import { queryLogs } from "@/app/lib/logs";
import { queryMetrics } from "@/app/lib/metrics";
import { buildScopeFromTicket } from "@/app/lib/scope";
import { fetchTicket } from "@/app/lib/tickets";
import { Incident, LogEntry, MetricSeries, Ticket } from "@/app/lib/types";
import { Field, Pill, Select } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";

const tabOrder = [
  { key: "incidents", label: "Incidents" },
  { key: "logs", label: "Logs" },
  { key: "metrics", label: "Metrics" },
] as const;

const ticketStatusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

type TabKey = (typeof tabOrder)[number]["key"];

type LoadingMap = Record<string, boolean>;
type ErrorMap = Record<string, string>;

const isNotFound = (err: unknown) => err instanceof Error && /404|not found/i.test(err.message);

const lastHourRange = () => {
  const end = new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
};

const formatJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const renderLogMessage = (message: LogEntry["message"]) => {
  if (message === null || message === undefined) return <p className="text-xs text-slate-500">No message</p>;
  if (typeof message === "string") return <p className="whitespace-pre-wrap text-sm text-slate-800">{message}</p>;
  if (typeof message === "object") {
    return (
      <pre className="whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-800">
        {formatJson(message)}
      </pre>
    );
  }
  return <p className="whitespace-pre-wrap text-sm text-slate-800">{String(message)}</p>;
};

const summarizeSeries = (series: MetricSeries) => {
  if (!series.points.length) return { latest: null, min: null, max: null, avg: null } as const;
  const values = series.points.map((p) => p.value);
  const latest = series.points[series.points.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { latest, min, max, avg } as const;
};

export default function TicketDetailPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const ticketId = useMemo(() => {
    const raw = params?.id as string;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const [activeTab, setActiveTab] = useState<TabKey>("incidents");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [metricSeries, setMetricSeries] = useState<MetricSeries[]>([]);
  const [loading, setLoading] = useState<LoadingMap>({});
  const [errors, setErrors] = useState<ErrorMap>({});

  const scope = useMemo(() => buildScopeFromTicket(ticket), [ticket]);

  const withState = async (key: string, fn: () => Promise<void>) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      await fn();
    } catch (err) {
      setErrors((prev) => ({ ...prev, [key]: err instanceof Error ? err.message : String(err) }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    await withState("ticket", async () => {
      const res = await fetchTicket(ticketId);
      setTicket(res);
      setStatusUpdate(res.status);
    });
  }, [ticketId]);

  const loadIncidents = useCallback(async () => {
    if (!ticketId) return;
    await withState("incidents", async () => {
      try {
        const res = await queryIncidents(Object.keys(scope).length ? scope : undefined);
        setIncidents(res as Incident[]);
      } catch (err) {
        if (isNotFound(err)) {
          setIncidents([]);
          return;
        }
        throw err;
      }
    });
  }, [scope, ticketId]);

  const loadLogs = useCallback(async () => {
    if (!ticketId) return;
    await withState("logs", async () => {
      try {
        const { start, end } = lastHourRange();
        const res = await queryLogs({
          query: scope.service ? `service:${scope.service}` : undefined,
          start,
          end,
          limit: 200,
          scope: Object.keys(scope).length ? scope : undefined,
        });
        setLogEntries(res as LogEntry[]);
      } catch (err) {
        if (isNotFound(err)) {
          setLogEntries([]);
          return;
        }
        throw err;
      }
    });
  }, [scope, ticketId]);

  const loadMetrics = useCallback(async () => {
    if (!ticketId) return;
    await withState("metrics", async () => {
      try {
        const { start, end } = lastHourRange();
        const expression = scope.service ? `service="${scope.service}"` : "up";
        const res = await queryMetrics({
          expression,
          start,
          end,
          step: 60 * 1_000_000_000,
          scope: Object.keys(scope).length ? scope : undefined,
        });
        setMetricSeries(res as MetricSeries[]);
      } catch (err) {
        if (isNotFound(err)) {
          setMetricSeries([]);
          return;
        }
        throw err;
      }
    });
  }, [scope, ticketId]);

  const updateStatus = async () => {
    if (!ticketId || !statusUpdate) return;
    const allowed = ticketStatusOptions.map((s) => s.value);
    if (!allowed.includes(statusUpdate)) {
      setErrors((prev) => ({ ...prev, status: "Select a valid status" }));
      return;
    }
    await withState("status", async () => {
      const res = await requestJSON<Ticket>(`/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusUpdate }),
      });
      setTicket(res);
      setStatusUpdate(res.status);
    });
  };

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (activeTab === "incidents") loadIncidents();
    if (activeTab === "logs") loadLogs();
    if (activeTab === "metrics") loadMetrics();
  }, [activeTab, loadIncidents, loadLogs, loadMetrics]);

  const hero = ticket ? (
    <div className="flex items-center gap-3">
      <Pill label={ticket.status} tone={ticket.status === "open" ? "warn" : "default"} />
      {ticket.key ? <Pill label={ticket.key} /> : null}
      <span className="text-xs uppercase tracking-[0.2em] text-[#3d8f92]">{ticket.id}</span>
    </div>
  ) : (
    "Ticket"
  );

  return (
    <AppShell
      title={ticket?.title || "Ticket detail"}
      description="Status, metadata, and related signals for this ticket."
      hero={hero}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Link href="/tickets" className="text-xs font-semibold text-[#0b1517] underline-offset-4 hover:underline">
            Back to all tickets
          </Link>
          {ticket?.reporter ? <Pill label={`reported by ${ticket.reporter}`} /> : null}
          {ticket?.assignees?.length ? <Pill label={`${ticket.assignees.length} assignees`} /> : null}
          {errors.ticket ? <Pill label={errors.ticket} tone="error" /> : null}
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {ticket ? (
              <>
                <span>Created {formatDate(ticket.createdAt)}</span>
                <span>Updated {formatDate(ticket.updatedAt)}</span>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                loadTicket();
                if (activeTab === "incidents") loadIncidents();
                if (activeTab === "logs") loadLogs();
                if (activeTab === "metrics") loadMetrics();
              }}
              className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <Pill label={ticket?.status || "loading"} tone={ticket?.status === "open" ? "warn" : "default"} />
            {ticket?.key ? <Pill label={ticket.key} /> : null}
            {ticket?.assignees?.length ? <span className="text-xs text-slate-600">Assignees: {ticket.assignees.join(", ")}</span> : null}
            {ticket?.reporter ? <span className="text-xs text-slate-600">Reporter: {ticket.reporter}</span> : null}
            {errors.status ? <Pill label={errors.status} tone="error" /> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr] sm:items-end">
            <Field
              label="Update status"
              input={
                <Select
                  value={statusUpdate}
                  onChange={setStatusUpdate}
                  options={ticketStatusOptions}
                />
              }
            />
            <button
              type="button"
              onClick={updateStatus}
              className="h-fit rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
              disabled={!statusUpdate || loading.status}
            >
              {loading.status ? "Saving..." : "Save status"}
            </button>
          </div>
          {ticket?.description ? <p className="text-slate-700">{ticket.description}</p> : <p className="text-slate-500">No description provided.</p>}
          <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700 sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Service</p>
              <p className="text-sm font-semibold text-slate-900">{scope.service || "unknown"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Environment</p>
              <p className="text-sm font-semibold text-slate-900">{scope.environment || "unknown"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Team</p>
              <p className="text-sm font-semibold text-slate-900">{scope.team || "unknown"}</p>
            </div>
          </div>
          {ticket?.fields ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Fields</p>
              <pre className="overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">{formatJson(ticket.fields)}</pre>
            </div>
          ) : null}
          {ticket?.metadata ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Metadata</p>
              <pre className="overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">{formatJson(ticket.metadata)}</pre>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2">
          {tabOrder.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab.key ? "bg-[#55cfd0] text-[#0b1517] shadow" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "incidents" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Incidents linked to this ticket</h2>
              {errors.incidents ? <Pill label={errors.incidents} tone="error" /> : null}
            </div>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {incidents.length === 0 ? (
                <p className="text-slate-500">No incidents fetched yet.</p>
              ) : (
                incidents.map((inc) => (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => router.push(`/incidents/${inc.id}`)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-[#55cfd0] hover:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{inc.title}</p>
                        <p className="text-xs text-slate-600">{inc.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill label={inc.status} tone={inc.status === "open" ? "warn" : "default"} />
                        <Pill label={inc.severity} tone={inc.severity === "sev1" ? "error" : "default"} />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">Updated {formatDate(inc.updatedAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "logs" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Logs related to this ticket scope</h2>
              <button
                type="button"
                onClick={loadLogs}
                className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 text-xs font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
              >
                {loading.logs ? "Loading..." : "Refresh"}
              </button>
            </div>
            {errors.logs ? <Pill label={errors.logs} tone="error" /> : null}
            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {logEntries.length === 0 ? (
                <p className="text-slate-500">No logs returned for this ticket (404 treated as empty).</p>
              ) : (
                logEntries.map((entry, idx) => (
                  <div key={`${entry.timestamp}-${idx}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{entry.severity || "info"}</span>
                      <span className="text-[11px] text-slate-500">{formatDate(entry.timestamp)}</span>
                    </div>
                    {renderLogMessage(entry.message)}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "metrics" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Metrics related to this ticket</h2>
              <button
                type="button"
                onClick={loadMetrics}
                className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 text-xs font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
              >
                {loading.metrics ? "Loading..." : "Refresh"}
              </button>
            </div>
            {errors.metrics ? <Pill label={errors.metrics} tone="error" /> : null}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {metricSeries.length === 0 ? (
                <p className="text-slate-500">No metric series returned (404 treated as empty).</p>
              ) : (
                metricSeries.map((series) => {
                  const stats = summarizeSeries(series);
                  const maxVal = Math.max(...series.points.map((p) => p.value), 1);
                  return (
                    <div key={series.name} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{series.name}</span>
                        <Pill label={`${series.points.length} points`} />
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-slate-600">
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Latest</p>
                          <p className="text-sm font-semibold text-slate-900">{stats.latest ? stats.latest.value.toFixed(2) : "-"}</p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Min</p>
                          <p className="text-sm font-semibold text-slate-900">{stats.min !== null ? stats.min.toFixed(2) : "-"}</p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Max</p>
                          <p className="text-sm font-semibold text-slate-900">{stats.max !== null ? stats.max.toFixed(2) : "-"}</p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Avg</p>
                          <p className="text-sm font-semibold text-slate-900">{stats.avg !== null ? stats.avg.toFixed(2) : "-"}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-end gap-1 overflow-x-auto">
                        {series.points.slice(-50).map((pt, idx) => (
                          <div
                            key={idx}
                            className="h-20 w-1.5 rounded-full bg-[#8fdede]"
                            style={{ height: `${(pt.value / maxVal) * 100 || 1}%` }}
                            title={`${pt.value} at ${formatDate(pt.timestamp)}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
