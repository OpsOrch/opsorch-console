"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { requestJSON } from "@/app/lib/api";
import { queryServices } from "@/app/lib/services";
import { queryIncidents } from "@/app/lib/incidents";
import { queryTickets } from "@/app/lib/tickets";
import { queryLogs } from "@/app/lib/logs";
import { LogEntry, MetricSeries, Service, Ticket, Incident } from "@/app/lib/types";
import { Pill } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";

const tabOrder = [
  { key: "incidents", label: "Incidents" },
  { key: "logs", label: "Logs" },
  { key: "metrics", label: "Metrics" },
  { key: "tickets", label: "Tickets" },
] as const;

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

export default function ServiceDetailPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const serviceId = useMemo(() => {
    const raw = params?.id as string;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const [activeTab, setActiveTab] = useState<TabKey>("incidents");
  const [service, setService] = useState<Service | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [metricSeries, setMetricSeries] = useState<MetricSeries[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<LoadingMap>({});
  const [errors, setErrors] = useState<ErrorMap>({});

  const serviceSearchTerm = useMemo(() => service?.name || serviceId || "", [service?.name, serviceId]);
  const scope = useMemo(() => {
    const values: { service?: string; environment?: string; team?: string } = {};
    const serviceValue = service?.name || serviceId;
    if (serviceValue) values.service = serviceValue;
    const env = service?.tags?.environment || service?.tags?.env;
    if (env) values.environment = env;
    const team = service?.tags?.team;
    if (team) values.team = team;
    return values;
  }, [service?.name, service?.tags, serviceId]);

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

  const loadService = useCallback(async () => {
    if (!serviceId) return;
    await withState("service", async () => {
      const res = await queryServices(scope.service);
      setService(res[0] || null);
    });
  }, [scope.service, serviceId]);

  const loadIncidents = useCallback(async () => {
    if (!serviceId) return;
    await withState("incidents", async () => {
      const scopePayload = { ...scope };
      if (!scopePayload.service && serviceSearchTerm) scopePayload.service = serviceSearchTerm;
      const queried = await queryIncidents(scopePayload);
      setIncidents(queried as Incident[]);
    });
  }, [scope, serviceId, serviceSearchTerm]);

  const loadLogs = useCallback(async () => {
    if (!serviceId) return;
    await withState("logs", async () => {
      try {
        const res = await queryLogs({
          query: `service:${serviceSearchTerm}`,
          start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
          limit: 100,
          scope,
        });
        setLogEntries(res as LogEntry[] );
      } catch (err) {
        if (isNotFound(err)) {
          if (serviceSearchTerm) {
            const { start, end } = lastHourRange();
            const fallbackBody: Record<string, unknown> = {
              query: `service:${serviceSearchTerm}`,
              start,
              end,
              limit: 100,
            };
            if (Object.keys(scope).length) fallbackBody.scope = scope;
            const fallback = await requestJSON<LogEntry[]>("/logs/query", {
              method: "POST",
              body: JSON.stringify(fallbackBody),
            });
            setLogEntries(fallback);
            return;
          }
          setLogEntries([]);
          return;
        }
        throw err;
      }
    });
  }, [scope, serviceId, serviceSearchTerm]);

  const loadMetrics = useCallback(async () => {
    if (!serviceId) return;
    await withState("metrics", async () => {
      try {
        const res = await requestJSON<MetricSeries[]>(`/services/${serviceId}/metrics`);
        setMetricSeries(res);
      } catch (err) {
        if (isNotFound(err)) {
          if (serviceSearchTerm) {
            const { start, end } = lastHourRange();
            const fallbackBody: Record<string, unknown> = {
              expression: `service="${serviceSearchTerm}"`,
              start,
              end,
              step: 60 * 1_000_000_000,
            };
            if (Object.keys(scope).length) fallbackBody.scope = scope;
            const fallback = await requestJSON<MetricSeries[]>("/metrics/query", {
              method: "POST",
              body: JSON.stringify(fallbackBody),
            });
            setMetricSeries(fallback);
            return;
          }
          setMetricSeries([]);
          return;
        }
        throw err;
      }
    });
  }, [scope, serviceId, serviceSearchTerm]);

  const loadTickets = useCallback(async () => {
    if (!serviceId) return;
    await withState("tickets", async () => {
      try {
        const res = await queryTickets(scope);
        setTickets(res);
      } catch (err) {
        if (isNotFound(err)) {
          setTickets([]);
          return;
        }
        throw err;
      }
    });
  }, [scope, serviceId]);

  useEffect(() => {
    loadService();
    loadIncidents();
  }, [loadIncidents, loadService]);

  useEffect(() => {
    if (activeTab === "logs") loadLogs();
    if (activeTab === "metrics") loadMetrics();
    if (activeTab === "tickets") loadTickets();
  }, [activeTab, loadLogs, loadMetrics, loadTickets]);

  const hero = service ? (
    <div className="flex items-center gap-3">
      <Pill label={service.id} />
      {service.tags ? <Pill label={`${Object.keys(service.tags).length} tags`} /> : null}
    </div>
  ) : (
    "Service"
  );

  return (
    <AppShell
      title={service?.name || "Service detail"}
      description="Incidents, telemetry, and tickets related to this service."
      hero={hero}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Link href="/services" className="text-xs font-semibold text-[#0b1517] underline-offset-4 hover:underline">
            Back to all services
          </Link>
          {service?.tags ? (
            <span className="text-xs text-slate-600">
              Tags: {Object.entries(service.tags).map(([k, v]) => `${k}=${v}`).join(", ")}
            </span>
          ) : (
            <span className="text-xs text-slate-600">No tags provided</span>
          )}
          {errors.service ? <Pill label={errors.service} tone="error" /> : null}
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
            <button
              type="button"
              onClick={() => {
                loadService();
                loadIncidents();
              }}
              className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-800">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Service</p>
            <p className="font-semibold text-slate-900">{scope.service || serviceId}</p>
          </div>
          {service?.tags ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Tags</p>
              <p className="font-mono text-xs text-slate-700">
                {Object.entries(service.tags)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", ") || "None"}
              </p>
            </div>
          ) : null}
          {service?.metadata ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Metadata</p>
              <pre className="overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">{formatJson(service.metadata)}</pre>
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
                activeTab === tab.key
                  ? "bg-[#55cfd0] text-[#0b1517] shadow"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "incidents" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Incidents for this service</h2>
              {errors.incidents ? <Pill label={errors.incidents} tone="error" /> : null}
            </div>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {incidents.length === 0 ? (
                <p className="text-slate-500">No incidents attached yet.</p>
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
              <h2 className="text-lg font-semibold text-slate-900">Logs for this service</h2>
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
                <p className="text-slate-500">No logs returned for this service (404 treated as empty).</p>
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
              <h2 className="text-lg font-semibold text-slate-900">Metrics for this service</h2>
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
              <h2 className="text-lg font-semibold text-slate-900">Tickets for this service</h2>
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
