"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { LogsPanel } from "@/app/components/LogsPanel";
import { MetricsPanel } from "@/app/components/MetricsPanel";
import { TicketsPanel } from "@/app/components/TicketsPanel";
import { AlertsPanel } from "@/app/components/AlertsPanel";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState } from "@/app/lib/hooks";
import { Deployment, QueryScope } from "@/app/lib/types";
import { formatDate, stringify } from "@/app/lib/utils";
import { CodeBlock, Pill, Section } from "@/app/lib/ui";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "alerts", label: "Alerts" },
  { id: "logs", label: "Logs" },
  { id: "metrics", label: "Metrics" },
  { id: "tickets", label: "Tickets" },
];

function deriveScope(deployment: Deployment): QueryScope {
  return {
    service: deployment.service,
    environment: deployment.environment,
  };
}

export default function DeploymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deploymentState = useAsyncState();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const deploymentId = Array.isArray(params.id) ? params.id[0] : params.id;

  const timeRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, []);

  useEffect(() => {
    if (!deploymentId) return;
    deploymentState.start();
    requestJSON<Deployment>(`/deployments/${deploymentId}`)
      .then((res) => {
        setDeployment(res);
        deploymentState.succeed();
      })
      .catch((err) => {
        deploymentState.fail(err);
      });
  }, [deploymentId, deploymentState]);



  if (deploymentState.loading) {
    return (
      <AppShell title="Loading..." description="Loading deployment details...">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-slate-200" />
          <div className="h-64 rounded-xl bg-slate-200" />
        </div>
      </AppShell>
    );
  }

  if (deploymentState.error || !deployment) {
    return (
      <AppShell title="Deployment Not Found" description="The requested deployment could not be found.">
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Deployment not found</p>
          <p className="mt-1 text-xs text-slate-500">The deployment {deploymentId} does not exist or has been removed.</p>
          <button
            type="button"
            onClick={() => router.push("/deployments")}
            className="mt-4 rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
          >
            Back to Deployments
          </button>
        </div>
      </AppShell>
    );
  }

  const scope = deriveScope(deployment);
  const deploymentType = deployment.metadata?.deployment_type as string;

  const hero = deployment ? (
    <div className="flex items-center gap-3">
      <Pill
        label={deployment.status}
        tone={
          deployment.status === "success" ? "success" :
            deployment.status === "failed" ? "error" :
              deployment.status === "running" ? "warn" : "default"
        }
      />
      {deployment.version && <Pill label={deployment.version} />}
      <span className="text-xs uppercase tracking-[0.2em] text-[#3d8f92]">{deployment.id}</span>
    </div>
  ) : (
    "Deployment"
  );

  return (
    <AppShell
      title={deployment?.service || "Deployment detail"}
      description="Deployment status, metadata, and related telemetry."
      hero={hero}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Link href="/deployments" className="text-xs font-semibold text-[#0b1517] underline-offset-4 hover:underline">
            Back to all deployments
          </Link>
          {deployment?.environment && <Pill label={`env:${deployment.environment}`} />}
          {deploymentType && <Pill label={`type:${deploymentType.replace("_", " ")}`} />}
          {deployment?.actor && <Pill label={`by ${deployment.actor.name}`} />}
          {deployment?.url ? (
            <a
              href={deployment.url}
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
            {deployment ? (
              <>
                <span>Started {formatDate(deployment.startedAt)}</span>
                {deployment.finishedAt && <span>Finished {formatDate(deployment.finishedAt)}</span>}
              </>
            ) : null}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab.id
                  ? "bg-[#55cfd0] text-[#0b1517] shadow"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" ? (
            <div className="space-y-4">
              {/* Deployment Metadata */}
              {deployment.metadata && Object.keys(deployment.metadata).length > 0 && (
                <Section title="Deployment Metadata">
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                    <CodeBlock code={stringify(deployment.metadata) || ""} language="json" />
                  </div>
                </Section>
              )}

              {/* Health Checks */}
              {deployment.metadata?.health_checks ? (
                <Section title="Health Checks">
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                    <div className="flex flex-wrap gap-2">
                      {(deployment.metadata.health_checks as string[]).map((check) => (
                        <Pill key={check} label={String(check)} />
                      ))}
                    </div>
                  </div>
                </Section>
              ) : null}

              {/* Monitoring Links */}
              {deployment.metadata?.monitoring_links ? (
                <Section title="Monitoring">
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                    <div className="space-y-2">
                      {(deployment.metadata.monitoring_links as string[]).map((link, index) => (
                        <a
                          key={index}
                          href={String(link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {String(link).includes("grafana") ? "Grafana Dashboard" :
                            String(link).includes("datadog") ? "Datadog Dashboard" :
                              String(link).includes("newrelic") ? "New Relic Dashboard" : "Monitoring Link"}
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                </Section>
              ) : null}
            </div>
          ) : null}

          {activeTab === "logs" ? (
            <LogsPanel
              initialReference={{
                expression: { search: "*" },
                start: timeRange.start,
                end: timeRange.end,
                scope,
              }}
              autoRun={true}
              readOnly={true}
            />
          ) : null}

          {activeTab === "metrics" ? (
            <MetricsPanel
              initialReference={{
                expression: { metricName: deployment.service ? `service="${deployment.service}"` : "up" },
                start: timeRange.start,
                end: timeRange.end,
                step: 60,
                scope,
              }}
              autoRun={true}
              readOnly={true}
            />
          ) : null}

          {activeTab === "alerts" ? (
            <AlertsPanel initialQuery={{ scope }} readOnly={true} />
          ) : null}

          {activeTab === "tickets" ? (
            <TicketsPanel readOnly={true} initialScope={scope} />
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}