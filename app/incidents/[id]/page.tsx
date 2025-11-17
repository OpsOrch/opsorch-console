"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { requestJSON } from "@/app/lib/api";
import { Incident, LogEntry, MetricSeries, Ticket, TimelineEntry } from "@/app/lib/types";
import { Field, Pill, TextArea, TextInput } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";
import { buildScopeFromIncident } from "@/app/lib/scope";
import { fetchIncident, fetchIncidentTimeline } from "@/app/lib/incidents";
import { queryLogs } from "@/app/lib/logs";
import { queryMetrics } from "@/app/lib/metrics";
import { queryTickets } from "@/app/lib/tickets";

const tabOrder = [
  { key: "timeline", label: "Timeline" },
  { key: "logs", label: "Logs" },
  { key: "metrics", label: "Metrics" },
  { key: "tickets", label: "Tickets" },
] as const;

type TabKey = (typeof tabOrder)[number]["key"];

type LoadingMap = Record<string, boolean>;
type ErrorMap = Record<string, string>;

type IncidentWithRelations = Incident & {
  timeline?: TimelineEntry[];
  logs?: LogEntry[];
  metrics?: MetricSeries[];
  tickets?: Ticket[];
  fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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

export default function IncidentDetailPage() {
  const params = useParams<{ id?: string }>();
  const incidentId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");
  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [metricSeries, setMetricSeries] = useState<MetricSeries[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [timelineForm, setTimelineForm] = useState({ kind: "note", body: "" });
  const [loading, setLoading] = useState<LoadingMap>({});
  const [errors, setErrors] = useState<ErrorMap>({});

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

  const deriveScope = useCallback((inc: IncidentWithRelations | null) => buildScopeFromIncident(inc), []);

  const loadIncident = useCallback(async () => {
    if (!incidentId) return;
    await withState("incident", async () => {
      const res = await fetchIncident(incidentId);
      setIncident(res);
    });
  }, [incidentId]);

  const loadTimeline = useCallback(async () => {
    if (!incidentId) return;
    await withState("timeline", async () => {
      const res = await fetchIncidentTimeline(incidentId);
      setTimeline(Array.isArray(res) ? res : []);
    });
  }, [incidentId]);

  const appendTimeline = async () => {
    if (!incidentId || !timelineForm.body) return;
    await withState("timeline", async () => {
      await requestJSON(`/incidents/${incidentId}/timeline`, {
        method: "POST",
        body: JSON.stringify(timelineForm),
      });
      setTimelineForm({ kind: "note", body: "" });
      await loadTimeline();
    });
  };

  const loadLogs = useCallback(async () => {
    if (!incidentId) return;
    await withState("logs", async () => {
      const scope = deriveScope(incident);
      const now = new Date();
      const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const end = now.toISOString();
      const res = await queryLogs({ start, end, limit: 200, scope });
      setLogEntries(res);
    });
  }, [deriveScope, incident, incidentId]);

  const loadMetrics = useCallback(async () => {
    if (!incidentId) return;
    await withState("metrics", async () => {
      const scope = deriveScope(incident);
      const now = new Date();
      const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const end = now.toISOString();
      const expression = scope.service ? `service="${scope.service}"` : "up";
      const res = await queryMetrics({
        expression,
        start,
        end,
        step: 60 * 1_000_000_000,
        scope,
      });
      setMetricSeries(res);
    });
  }, [deriveScope, incident, incidentId]);

  const loadTickets = useCallback(async () => {
    if (!incidentId) return;
    await withState("tickets", async () => {
      const scope = deriveScope(incident);
      const res = await queryTickets(scope);
      setTickets(res);
    });
  }, [deriveScope, incident, incidentId]);

  useEffect(() => {
    loadIncident();
    loadTimeline();
  }, [loadIncident, loadTimeline]);

  useEffect(() => {
    if (activeTab === "logs") loadLogs();
    if (activeTab === "metrics") loadMetrics();
    if (activeTab === "tickets") loadTickets();
  }, [activeTab, loadLogs, loadMetrics, loadTickets]);

  const hero = incident ? (
    <div className="flex items-center gap-3">
      <Pill label={incident.severity} tone={incident.severity === "sev1" ? "error" : "default"} />
      <span className="text-xs uppercase tracking-[0.2em] text-[#3d8f92]">{incident.id}</span>
    </div>
  ) : (
    "Incident"
  );

  return (
    <AppShell
      title={incident?.title || "Incident detail"}
      description="Timeline, telemetry, and tickets tied to this incident."
      hero={hero}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Link href="/incidents" className="text-xs font-semibold text-[#0b1517] underline-offset-4 hover:underline">
            Back to all incidents
          </Link>
          <Pill label={incident?.status || "loading"} tone={incident?.status === "open" ? "warn" : "default"} />
          {incident?.severity ? <Pill label={incident.severity} tone={incident.severity === "sev1" ? "error" : "default"} /> : null}
          {incident?.service ? <Pill label={`svc:${incident.service}`} /> : null}
          {errors.incident ? <Pill label={errors.incident} tone="error" /> : null}
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {incident ? (
              <>
                <span>Created {formatDate(incident.createdAt)}</span>
                <span>Updated {formatDate(incident.updatedAt)}</span>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                loadIncident();
                loadTimeline();
              }}
              className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-700 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">Service</span>
            <span className="inline-flex w-fit items-center rounded-full bg-slate-900/5 px-3 py-1.5 text-sm font-semibold text-slate-800">
              {buildScopeFromIncident(incident).service || "unknown"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">Environment</span>
            <span className="inline-flex w-fit items-center rounded-full bg-slate-900/5 px-3 py-1.5 text-sm font-semibold text-slate-800">
              {buildScopeFromIncident(incident).environment || "unknown"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">Team</span>
            <span className="inline-flex w-fit items-center rounded-full bg-slate-900/5 px-3 py-1.5 text-sm font-semibold text-slate-800">
              {buildScopeFromIncident(incident).team || "unknown"}
            </span>
          </div>
          <p className="md:col-span-3 text-[11px] text-slate-500">Scope is inferred from the incident service/fields/metadata and sent with log/metric/ticket queries.</p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2">
          {tabOrder.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-[#55cfd0] text-[#0b1517] shadow"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "timeline" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
              {errors.timeline ? <Pill label={errors.timeline} tone="error" /> : null}
            </div>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {timeline.length === 0 ? (
                <p className="text-slate-500">No entries yet.</p>
              ) : (
                timeline.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{entry.kind}</span>
                      <span className="text-[11px] text-slate-500">{formatDate(entry.at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800">{entry.body}</p>
                  </div>
                ))
              )}
            </div>
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white/90 p-4">
              <div className="grid gap-3 sm:grid-cols-5 sm:gap-4">
                <Field
                  label="Kind"
                  input={
                    <TextInput
                      value={timelineForm.kind}
                      onChange={(v) => setTimelineForm((f) => ({ ...f, kind: v }))}
                      placeholder="note"
                    />
                  }
                />
                <div className="sm:col-span-4">
                  <Field
                    label="Body"
                    input={
                      <TextArea
                        value={timelineForm.body}
                        onChange={(v) => setTimelineForm((f) => ({ ...f, body: v }))}
                        placeholder="Added mitigation details"
                      />
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={appendTimeline}
                  disabled={!timelineForm.body || loading.timeline}
                  className="rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8] disabled:cursor-not-allowed disabled:bg-[#b7eded]"
                >
                  {loading.timeline ? "Saving..." : "Append entry"}
                </button>
                {errors.timeline ? <Pill label={errors.timeline} tone="error" /> : null}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "logs" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Logs tied to incident</h2>
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
                <p className="text-slate-500">No logs returned for this incident (404 treated as empty).</p>
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
              <h2 className="text-lg font-semibold text-slate-900">Metrics related to incident</h2>
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
                            className="rounded-sm bg-[#55cfd0]"
                            style={{
                              height: `${Math.max(4, (pt.value / maxVal) * 60)}px`,
                              width: "6px",
                            }}
                            title={`${formatDate(pt.timestamp)} • ${pt.value}`}
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

        {activeTab === "tickets" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Tickets linked to incident</h2>
              <button
                type="button"
                onClick={loadTickets}
                className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 text-xs font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
              >
                {loading.tickets ? "Loading..." : "Refresh"}
              </button>
            </div>
            {errors.tickets ? <Pill label={errors.tickets} tone="error" /> : null}
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {tickets.length === 0 ? (
                <p className="text-slate-500">No tickets yet (404 treated as empty).</p>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{t.title}</p>
                        <p className="text-xs text-slate-600">{t.description || "No description"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.key ? <Pill label={t.key} /> : null}
                        <Pill label={t.status} />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Created {formatDate(t.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

      </div>
    </AppShell>
  );
}
