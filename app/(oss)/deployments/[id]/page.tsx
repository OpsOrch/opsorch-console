"use client";

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
  }, [deploymentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "running":
        return "text-blue-600 bg-blue-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getDeploymentTypeIcon = (deploymentType: string) => {
    switch (deploymentType) {
      case "rollback":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case "canary":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case "blue_green":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
    }
  };

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

  return (
    <AppShell
      title={`${deployment.service || "Unknown Service"} ${deployment.version || ""}`}
      description={`Deployment ${deployment.id} in ${deployment.environment || "unknown environment"}`}
    >
      <div className="space-y-4">
        {/* Deployment Header */}
        <Section title="Deployment Details">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <div className="text-blue-600">
                    {getDeploymentTypeIcon(deploymentType)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-slate-900">{deployment.service || "Unknown Service"}</h1>
                    {deployment.version && <Pill label={deployment.version} />}
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(deployment.status)}`}>
                      {deployment.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{deployment.id}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                    <span>Environment: <strong>{deployment.environment || "Unknown"}</strong></span>
                    {deploymentType && <span>Type: <strong className="capitalize">{deploymentType.replace("_", " ")}</strong></span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/deployments")}
                className="rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
              >
                Back to Deployments
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <span className="font-medium text-slate-600">Started:</span>
                <p className="text-slate-900">{formatDate(deployment.startedAt)}</p>
              </div>
              {deployment.finishedAt ? (
                <div>
                  <span className="font-medium text-slate-600">Finished:</span>
                  <p className="text-slate-900">{formatDate(deployment.finishedAt)}</p>
                </div>
              ) : null}
              {deployment.actor?.name ? (
                <div>
                  <span className="font-medium text-slate-600">Actor:</span>
                  <p className="text-slate-900">{String(deployment.actor.name)}</p>
                </div>
              ) : null}
              {deployment.metadata?.duration ? (
                <div>
                  <span className="font-medium text-slate-600">Duration:</span>
                  <p className="text-slate-900">{String(deployment.metadata.duration)}</p>
                </div>
              ) : null}
            </div>

            {deployment.url && (
              <div className="mt-4">
                <a
                  href={deployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
                >
                  View Deployment
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </Section>

        {/* Navigation Tabs */}
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
    </AppShell>
  );
}