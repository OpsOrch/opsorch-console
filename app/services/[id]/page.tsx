"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { LogsPanel } from "@/app/components/LogsPanel";
import { MetricsPanel } from "@/app/components/MetricsPanel";
import { TicketsPanel } from "@/app/components/TicketsPanel";
import { queryServices } from "@/app/lib/services";
import { queryIncidents } from "@/app/lib/incidents";
import { Service, Incident, LogReference, MetricReference } from "@/app/lib/types";
import { Pill } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";

const tabOrder = [
  { key: "incidents", label: "Incidents" },
  { key: "logs", label: "Logs" },
  { key: "metrics", label: "Metrics" },
  { key: "tickets", label: "Tickets" },
] as const;

type TabKey = (typeof tabOrder)[number]["key"];


type ErrorMap = Record<string, string>;

const formatJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      await fn();
    } catch (err) {
      setErrors((prev) => ({ ...prev, [key]: err instanceof Error ? err.message : String(err) }));
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



  useEffect(() => {
    loadService();
    loadIncidents();
  }, [loadIncidents, loadService]);



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
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab.key
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
          <LogsPanel
            initialReference={{
              query: "*",
              start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
            } as LogReference}
            autoRun={true}
            readOnly={true}
          />
        ) : null}

        {activeTab === "metrics" ? (
          <MetricsPanel
            initialReference={{
              expression: serviceSearchTerm ? `service="${serviceSearchTerm}"` : "up",
              start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
              step: 60,
            } as MetricReference}
            autoRun={true}
            readOnly={true}
          />
        ) : null}

        {activeTab === "tickets" ? (
          <TicketsPanel readOnly={true} initialScope={JSON.stringify(scope)} />
        ) : null}

      </div>
    </AppShell>
  );
}
