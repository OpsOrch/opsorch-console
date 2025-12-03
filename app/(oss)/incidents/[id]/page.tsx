"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { LogsPanel } from "@/app/components/LogsPanel";
import { MetricsPanel } from "@/app/components/MetricsPanel";
import { TicketsPanel } from "@/app/components/TicketsPanel";
import { AlertsPanel } from "@/app/components/AlertsPanel";
import { requestJSON } from "@/app/lib/api";
import { Incident, TimelineEntry } from "@/app/lib/types";
import { Field, Pill, TextArea, TextInput } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";
import { buildScopeFromIncident } from "@/app/lib/scope";
import { fetchIncident, fetchIncidentTimeline } from "@/app/lib/incidents";

const tabOrder = [
  { key: "timeline", label: "Timeline" },
  { key: "alerts", label: "Alerts" },
  { key: "logs", label: "Logs" },
  { key: "metrics", label: "Metrics" },
  { key: "tickets", label: "Tickets" },
] as const;

type TabKey = (typeof tabOrder)[number]["key"];

type LoadingMap = Record<string, boolean>;
type ErrorMap = Record<string, string>;



export default function IncidentDetailPage() {
  const params = useParams<{ id?: string }>();
  const incidentId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");
  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
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

  const deriveScope = useCallback((inc: Incident | null) => buildScopeFromIncident(inc), []);

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



  useEffect(() => {
    loadIncident();
    loadTimeline();
  }, [loadIncident, loadTimeline]);



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
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab.key
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
            <div className="relative flex max-h-[32rem] flex-col gap-6 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm">
              {timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500">No timeline entries yet.</p>
                </div>
              ) : (
                <div className="relative ml-2 space-y-6 border-l-2 border-slate-200 pl-6">
                  {timeline.map((entry) => {
                    const kindColor =
                      entry.kind === "alert" ? "bg-rose-500" :
                        entry.kind === "status" ? "bg-amber-500" :
                          entry.kind === "metric" ? "bg-purple-500" :
                            "bg-slate-400";
                    return (
                      <div key={entry.id} className="relative">
                        <span className={`absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-white ring-1 ring-slate-200 ${kindColor}`} />
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold uppercase tracking-wider text-slate-700">{entry.kind}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">{formatDate(entry.at)}</span>
                            {entry.actor ? (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-medium text-slate-600">
                                  {String(entry.actor.name || entry.actor.email || "System")}
                                </span>
                              </>
                            ) : null}
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="whitespace-pre-wrap text-slate-800">{entry.body}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

        {activeTab === "alerts" ? (
          <AlertsPanel initialQuery={{ scope: deriveScope(incident) }} readOnly={true} />
        ) : null}

        {activeTab === "logs" ? (
          <LogsPanel
            initialReference={{
              expression: { search: "*" },
              start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
              scope: deriveScope(incident),
            }}
            autoRun={true}
            readOnly={true}
          />
        ) : null}

        {activeTab === "metrics" ? (
          <MetricsPanel
            initialReference={{
              expression: { metricName: deriveScope(incident).service ? `service="${deriveScope(incident).service}"` : "up" },
              start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
              step: 60,
              scope: deriveScope(incident),
            }}
            autoRun={true}
            readOnly={true}
          />
        ) : null}

        {activeTab === "tickets" ? (
          <TicketsPanel readOnly={true} initialScope={deriveScope(incident)} />
        ) : null}

      </div>
    </AppShell>
  );
}
