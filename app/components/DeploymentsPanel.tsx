import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState, useIntegrations } from "@/app/lib/hooks";
import { Deployment, QueryScope } from "@/app/lib/types";
import { formatDate, stringify } from "@/app/lib/utils";
import { DEFAULT_QUERY_LIMIT } from "@/app/lib/consts";
import { CodeBlock, Field, Pill, Section, TextInput, Badge } from "@/app/lib/ui";
import { ScopeInputs } from "@/app/components/ScopeInputs";
import { EmptyState } from "@/app/components/EmptyState";

type DeploymentsPanelProps = {
  initialDeploymentId?: string;
  readOnly?: boolean;
  initialScope?: QueryScope;
  initialQuery?: {
    query?: string;
    statuses?: string[];
    versions?: string[];
    scope?: QueryScope;
  };
  autoRun?: boolean;
};

export function DeploymentsPanel({ initialDeploymentId, readOnly = false, initialScope, initialQuery }: DeploymentsPanelProps = {}) {
  const router = useRouter();
  const deploymentState = useAsyncState();
  const { hasIntegrations, loading: integrationsLoading } = useIntegrations();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [searchText, setSearchText] = useState(initialQuery?.query || "");
  const [searchStatuses, setSearchStatuses] = useState(initialQuery?.statuses?.join(", ") || "");
  const [searchVersions, setSearchVersions] = useState(initialQuery?.versions?.join(", ") || "");
  const [searchLimit, setSearchLimit] = useState(String(DEFAULT_QUERY_LIMIT));
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initialScope || initialQuery?.scope));
  const [deploymentScope, setDeploymentScope] = useState<QueryScope | undefined>(initialScope || initialQuery?.scope);
  const [viewMode, setViewMode] = useState<"list" | "timeline" | "stats">("list");

  const activeDeployment = selectedDeployment && deployments.find((d) => d.id === selectedDeployment.id)
    ? selectedDeployment
    : deployments[0] || null;

  const runSearch = async () => {
    deploymentState.start();
    try {
      const body: Record<string, unknown> = {};
      const statuses = searchStatuses
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const versions = searchVersions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const limitNum = Number(searchLimit);

      if (statuses.length) body.statuses = statuses;
      if (versions.length) body.versions = versions;
      if (searchText.trim()) {
        body.query = searchText.trim();
      }
      if (!Number.isNaN(limitNum) && limitNum > 0) body.limit = limitNum;

      // Add scope if provided
      if (deploymentScope) {
        body.scope = deploymentScope;
      }

      const res = await requestJSON<Deployment[]>("/deployments/query", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setDeployments(res);
      setSelectedDeployment(res[0] || null);
      deploymentState.succeed();
    } catch (err) {
      deploymentState.fail(err);
    }
  };

  const loadDeploymentFromReference = useCallback(async (deploymentId: string) => {
    if (!deploymentId) return;
    deploymentState.start();
    try {
      const res = await requestJSON<Deployment>(`/deployments/${deploymentId}`);
      setDeployments((prev) => [res, ...prev.filter((d) => d.id !== res.id)]);
      setSelectedDeployment(res);
      deploymentState.succeed();
    } catch (err) {
      deploymentState.fail(err);
    }
  }, [deploymentState]);

  useEffect(() => {
    if (!initialDeploymentId) return;
    const frame = requestAnimationFrame(() => {
      loadDeploymentFromReference(initialDeploymentId);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialDeploymentId, loadDeploymentFromReference]);

  const resetToDefaults = () => {
    setSearchText("");
    setSearchStatuses("");
    setSearchVersions("");
    setSearchLimit(String(DEFAULT_QUERY_LIMIT));
    setDeploymentScope(undefined);
    // trigger a search with default values
    requestAnimationFrame(() => {
      deploymentState.start();
      const body = { limit: DEFAULT_QUERY_LIMIT };
      requestJSON<Deployment[]>("/deployments/query", {
        method: "POST",
        body: JSON.stringify(body),
      }).then(res => {
        setDeployments(res);
        setSelectedDeployment(res[0] || null);
        deploymentState.succeed();
      }).catch(err => deploymentState.fail(err));
    });
  };

  const isDefaultQuery = () => {
    return (
      !searchText &&
      !searchStatuses &&
      !searchVersions &&
      !deploymentScope &&
      searchLimit === String(DEFAULT_QUERY_LIMIT)
    );
  };

  // Auto-run search on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void runSearch();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const getDeploymentIcon = (deployment: Deployment) => {
    const deploymentType = deployment.metadata?.deployment_type as string;
    switch (deploymentType) {
      case "rollback":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case "canary":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
    }
  };

  return (
    <Section
      id="deployments-panel"
      title="Deployments"
      description="Search deployments by service name, environment, or status. View deployment history and correlate with incidents."
    >
      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">
        <div className="grid grid-cols-[2fr_auto] items-end gap-2">
          <Field
            label="Search deployments"
            input={
              <TextInput
                value={searchText}
                onChange={setSearchText}
                placeholder="checkout, production, failed deployment"
              />
            }
          />
          <div className="flex gap-2">
            {!readOnly && !isDefaultQuery() && (
              <button
                type="button"
                onClick={resetToDefaults}
                className="h-fit rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={runSearch}
              className="h-fit rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-semibold text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0] hover:text-[#0b1517]"
            >
              Search
            </button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <Field
            label="Status filter (optional)"
            input={<TextInput value={searchStatuses} onChange={setSearchStatuses} placeholder="success, failed, running" />}
          />
          <Field
            label="Version filter (optional)"
            input={<TextInput value={searchVersions} onChange={setSearchVersions} placeholder="v2.31, latest, beta" />}
          />
        </div>
        <Field
          label="Limit"
          input={<TextInput value={searchLimit} onChange={setSearchLimit} type="number" placeholder="20" />}
        />

        <div className="flex flex-wrap gap-2 text-[11px] text-[#1c3134]">
          <span className="font-semibold">Quick filters:</span>
          {[
            { label: "successful", value: "success" },
            { label: "failed", value: "failed" },
            { label: "running", value: "running" },
            { label: "production", value: "", scope: { environment: "prod" } },
            { label: "staging", value: "", scope: { environment: "staging" } }
          ].map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => {
                if (filter.value) {
                  setSearchStatuses(filter.value);
                } else if (filter.scope) {
                  setDeploymentScope(filter.scope);
                }
              }}
              className="rounded-full border border-[#8fdede] bg-white px-2 py-1 transition hover:border-[#55cfd0]"
            >
              {filter.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSearchStatuses("");
              setSearchVersions("");
              setSearchText("");
              setDeploymentScope(undefined);
            }}
            className="rounded-full border border-slate-300 bg-white px-2 py-1 transition hover:border-slate-400"
          >
            clear all
          </button>
        </div>

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
            <ScopeInputs
              scope={deploymentScope}
              onChange={setDeploymentScope}
            />
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">View:</span>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(["list", "timeline", "stats"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded px-3 py-1 text-xs font-medium transition ${viewMode === mode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === "stats" && deployments.length > 0 && (
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">Total</p>
              <p className="mt-1 text-lg font-bold text-emerald-900">{deployments.length}</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 px-3 py-2 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-green-600">Success</p>
              <p className="mt-1 text-lg font-bold text-green-900">
                {deployments.filter(d => d.status === "success").length}
              </p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-red-50 to-pink-50 px-3 py-2 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-red-600">Failed</p>
              <p className="mt-1 text-lg font-bold text-red-900">
                {deployments.filter(d => d.status === "failed").length}
              </p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-sky-50 px-3 py-2 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600">Running</p>
              <p className="mt-1 text-lg font-bold text-blue-900">
                {deployments.filter(d => d.status === "running").length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 px-3 py-2 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-purple-600">Services</p>
              <p className="mt-1 text-lg font-bold text-purple-900">
                {new Set(deployments.map(d => d.service).filter(Boolean)).size}
              </p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 px-3 py-2 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600">Environments</p>
              <p className="mt-1 text-lg font-bold text-amber-900">
                {new Set(deployments.map(d => d.environment).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">
        <div className={`flex flex-col gap-2 ${viewMode === "list" ? "max-h-52 xl:max-h-[24rem] 2xl:max-h-[32rem]" : "max-h-96 xl:max-h-[32rem] 2xl:max-h-[40rem]"} overflow-y-auto`}>
          {deploymentState.error ? (
            <EmptyState
              title="Error loading deployments"
              description={deploymentState.error}
              variant="error"
              action={{ label: "Retry", onClick: runSearch }}
            />
          ) : deploymentState.loading && deployments.length === 0 ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-5 w-16 rounded-full bg-slate-200" />
                  </div>
                  <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
                </div>
              ))}
            </>
          ) : (deploymentState.loading || integrationsLoading) && deployments.length === 0 ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex h-16 animate-pulse items-center justify-between rounded-lg border border-slate-200 bg-white px-4">
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-4 w-24 rounded bg-slate-200" />
                </div>
              ))}
            </>
          ) : !hasIntegrations ? (
            <EmptyState
              title="No integration configured"
              description="Connect an integration to manage deployments."
              variant="no-integration"
              action={{ label: "Configure Integration", onClick: () => router.push("/settings") }}
            />
          ) : deployments.length === 0 ? (
            <EmptyState
              title={readOnly ? "No deployments" : isDefaultQuery() ? "No deployments found" : "No matching deployments"}
              description={readOnly ? "No deployments to display." : isDefaultQuery() ? "There are no deployments in the system currently." : "Try adjusting your search filters or resetting to default."}
              variant={readOnly ? "default" : "no-data"}
              action={!readOnly && !isDefaultQuery() ? { label: "Reset to Default", onClick: resetToDefaults } : { label: "Refresh", onClick: runSearch }}
            />
          ) : viewMode === "timeline" ? (
            <div className="space-y-4">
              {deployments
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .map((d, index) => (
                  <div key={d.id} className="animate-fade-in relative">
                    {index < deployments.length - 1 && (
                      <div className="absolute left-6 top-12 h-full w-0.5 bg-slate-200" />
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(`/deployments/${d.id}`)}
                      className="w-full flex items-start gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[#55cfd0] hover:shadow-md"
                    >
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm ${getStatusColor(d.status)}`}>
                        <div className="text-current">
                          {getDeploymentIcon(d)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900 truncate">{d.service || "Unknown Service"}</p>
                          {d.version && <Badge label={String(d.version)} variant="default" size="sm" />}
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(d.status)}`}>
                            {d.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{d.environment}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Started: {formatDate(d.startedAt)}</span>
                          {d.finishedAt ? <span>Finished: {formatDate(d.finishedAt)}</span> : null}
                          {d.actor?.name ? <span>By: {String(d.actor.name)}</span> : null}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            deployments.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => router.push(`/deployments/${d.id}`)}
                className="animate-fade-in flex items-center gap-3 justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-all hover:border-[#55cfd0] hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${selectedDeployment?.id === d.id ? "bg-blue-100" : "bg-slate-100"
                    }`}>
                    <div className={`${selectedDeployment?.id === d.id ? "text-blue-600" : "text-slate-500"}`}>
                      {getDeploymentIcon(d)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{d.service || "Unknown Service"}</p>
                      {d.version && <span className="text-xs text-slate-500">{d.version}</span>}
                    </div>
                    <p className="text-xs text-slate-600">{d.environment} • {formatDate(d.startedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(d.status)}`}>
                    {d.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {activeDeployment ? (
        <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deployment</p>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{activeDeployment.service || "Unknown Service"}</h3>
                {activeDeployment.version && <Pill label={activeDeployment.version} />}
              </div>
              <p className="text-xs text-slate-500">{activeDeployment.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/deployments/${activeDeployment.id}`)}
                className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 text-xs font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
              >
                Open detail
              </button>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(activeDeployment.status)}`}>
                {activeDeployment.status}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-medium text-slate-600">Environment:</span>
              <span className="ml-1 text-slate-900">{activeDeployment.environment || "Unknown"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-600">Started:</span>
              <span className="ml-1 text-slate-900">{formatDate(activeDeployment.startedAt)}</span>
            </div>
            {activeDeployment.finishedAt && (
              <div>
                <span className="font-medium text-slate-600">Finished:</span>
                <span className="ml-1 text-slate-900">{formatDate(activeDeployment.finishedAt)}</span>
              </div>
            )}
            {activeDeployment.actor?.name ? (
              <div>
                <span className="font-medium text-slate-600">Actor:</span>
                <span className="ml-1 text-slate-900">{String(activeDeployment.actor.name)}</span>
              </div>
            ) : null}
          </div>

          {activeDeployment.url && (
            <div className="mt-3">
              <a
                href={activeDeployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                Open in Tool
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {activeDeployment.metadata && Object.keys(activeDeployment.metadata).length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</p>
              <CodeBlock code={stringify(activeDeployment.metadata) || ""} language="json" />
            </div>
          )}
        </div>
      ) : null}
    </Section>
  );
}