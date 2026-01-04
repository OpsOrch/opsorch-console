"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { LogsPanel } from "@/app/components/LogsPanel";
import { MetricsPanel } from "@/app/components/MetricsPanel";
import { TicketsPanel } from "@/app/components/TicketsPanel";
import { AlertsPanel } from "@/app/components/AlertsPanel";
import { queryServices } from "@/app/lib/services";
import { queryIncidents } from "@/app/lib/incidents";
import { Service, Incident } from "@/app/lib/types";
import { Pill } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";

const tabOrder = [
  { key: "incidents", label: "Incidents" },
  { key: "alerts", label: "Alerts" },
  { key: "logs", label: "Logs" },
  { key: "metrics", label: "Metrics" },
  { key: "tickets", label: "Tickets" },
] as const;

type TabKey = (typeof tabOrder)[number]["key"];


type ErrorMap = Record<string, string>;


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
      const queried = await queryIncidents({ scope: scopePayload });
      setIncidents(queried as Incident[]);
    });
  }, [scope, serviceId, serviceSearchTerm]);



  useEffect(() => {
    loadService();
    loadIncidents();
  }, [loadIncidents, loadService]);



  const hero = service ? (
    <div className="flex items-center gap-3">
      {service.tags?.status && <Pill label={service.tags.status} tone={service.tags.status === "healthy" ? "success" : service.tags.status === "degraded" ? "warn" : "error"} />}
      <span className="text-xs uppercase tracking-[0.2em] text-[#3d8f92]">{service.name}</span>
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
          <Pill label={`svc:${service?.name || serviceId}`} />
          {service?.tags?.status && <Pill label={service.tags.status} tone={service.tags.status === "healthy" ? "success" : service.tags.status === "degraded" ? "warn" : "error"} />}
          {service?.tags?.environment && <Pill label={`env:${service.tags.environment}`} />}
          {service?.tags?.team && <Pill label={`team:${service.tags.team}`} />}
          {service?.tags && Object.entries(service.tags)
            .filter(([k]) => !['status', 'environment', 'env', 'team'].includes(k))
            .map(([k, v]) => (
              <Pill key={k} label={`${k}:${v}`} />
            ))
          }
          {service?.url ? (
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[#8fdede] bg-white px-2 py-1 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:text-[#0b1517]"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View service
            </a>
          ) : null}
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

        {service ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Service Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium uppercase text-slate-500">Name</span>
                <p className="text-slate-700">{service.name}</p>
              </div>
              {service.tags && Object.keys(service.tags).length > 0 ? (
                <div>
                  <span className="text-xs font-medium uppercase text-slate-500">Tags</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(service.tags).map(([k, v]) => (
                      <Pill key={k} label={`${k}:${v}`} />
                    ))}
                  </div>
                </div>
              ) : null}
              {service.metadata && Object.keys(service.metadata).length > 0 ? (
                <div>
                  <span className="text-xs font-medium uppercase text-slate-500">Metadata</span>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
                    {JSON.stringify(service.metadata, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

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

        {activeTab === "alerts" ? (
          <AlertsPanel initialQuery={{ scope }} readOnly={true} />
        ) : null}

        {activeTab === "logs" ? (
          <LogsPanel
            initialReference={{
              expression: { search: "*" },
              start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
              scope,
            }}
            autoRun={true}
            readOnly={true}
          />
        ) : null}

        {activeTab === "metrics" ? (
          <MetricsPanel
            initialReference={{
              expression: { metricName: "" },
              start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
              step: 60,
              scope,
            }}
            autoRun={true}
            readOnly={true}
          />
        ) : null}

        {activeTab === "tickets" ? (
          <TicketsPanel readOnly={true} initialScope={scope} />
        ) : null}

      </div>
    </AppShell>
  );
}
