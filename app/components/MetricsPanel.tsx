import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncState, useIntegrations } from "@/app/lib/hooks";
import { requestJSON } from "@/app/lib/api";
import { MetricSeries, MetricReference, MetricDescriptor } from "@/app/lib/types";
import { Badge, Field, Section, TextInput, TimeSeriesChart, Gauge, Histogram } from "@/app/lib/ui";
import { MetricAutocomplete } from "@/app/components/MetricAutocomplete";
import { ScopeInputs } from "@/app/components/ScopeInputs";
import { EmptyState } from "@/app/components/EmptyState";

type MetricsPanelProps = {
  initialReference?: MetricReference;
  autoRun?: boolean;
  readOnly?: boolean;
};

const toInputTimestamp = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 16);
};

const deriveMetricQuery = (reference?: MetricReference) => {
  const defaultEnd = new Date();
  const defaultStart = new Date(defaultEnd.getTime() - 30 * 60 * 1000);
  const defaultExpression = reference?.expression?.metricName || "";
  return {
    expression: defaultExpression,
    aggregation: reference?.expression?.aggregation || "",
    filters: reference?.expression?.filters || [],
    groupBy: reference?.expression?.groupBy || [],
    start: toInputTimestamp(reference?.start) || defaultStart.toISOString().slice(0, 16),
    end: toInputTimestamp(reference?.end) || defaultEnd.toISOString().slice(0, 16),
    stepSeconds: reference?.step ?? 30,
    scope: reference?.scope,
  };
};

export function MetricsPanel({ initialReference, autoRun = false, readOnly = false }: MetricsPanelProps = {}) {
  const router = useRouter();
  const metricState = useAsyncState();
  const [metricQuery, setMetricQuery] = useState(() => deriveMetricQuery(initialReference));
  const [metricSeries, setMetricSeries] = useState<MetricSeries[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initialReference?.expression?.aggregation || initialReference?.expression?.groupBy?.length || initialReference?.scope));
  const [aggregation, setAggregation] = useState(() => initialReference?.expression?.aggregation || "");
  const [groupBy, setGroupBy] = useState(() => initialReference?.expression?.groupBy?.join(", ") || "");
  const [visualizationType, setVisualizationType] = useState<"timeseries" | "histogram" | "gauge">("timeseries");
  const [gaugeStatistic, setGaugeStatistic] = useState<"latest" | "avg" | "min" | "max">("latest");
  const { start, succeed, fail } = metricState;
  const { hasIntegrations, loading: integrationsLoading } = useIntegrations();

  const setRangeMinutes = (mins: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - mins * 60 * 1000);
    setMetricQuery((q) => ({ ...q, start: start.toISOString().slice(0, 16), end: end.toISOString().slice(0, 16) }));
  };

  const summarize = (series: MetricSeries) => {
    if (!series.points.length) {
      return { latest: null, min: null, max: null, avg: null } as const;
    }
    const values = series.points.map((p) => p.value);
    const latest = series.points[series.points.length - 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { latest, min, max, avg } as const;
  };

  const formatNumber = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return "-";
    return Number(value).toFixed(2);
  };

  const formatTimestampShort = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const executeMetricQuery = useCallback(async (query: typeof metricQuery) => {
    start();
    try {
      const stepSeconds = Number(query.stepSeconds);
      const resolvedStep = Number.isFinite(stepSeconds) && stepSeconds > 0 ? stepSeconds : 30;
      const expression: Record<string, unknown> = { metricName: query.expression };
      if (aggregation) expression.aggregation = aggregation;
      if (groupBy) expression.groupBy = groupBy.split(",").map(s => s.trim()).filter(Boolean);
      const payload: Record<string, unknown> = {
        expression,
        start: new Date(query.start).toISOString(),
        end: new Date(query.end).toISOString(),
        step: resolvedStep,
        scope: query.scope,
      };
      const res = await requestJSON<MetricSeries[]>("/metrics/query", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMetricSeries(res);
      succeed();
    } catch (err) {
      fail(err);
    }
  }, [fail, setMetricSeries, start, succeed, aggregation, groupBy]);

  const [prevInitialReference, setPrevInitialReference] = useState(initialReference);
  if (initialReference !== prevInitialReference) {
    setPrevInitialReference(initialReference);
    setMetricQuery(deriveMetricQuery(initialReference));
  }

  // State for available metrics to determine a valid default
  const [availableMetrics, setAvailableMetrics] = useState<MetricDescriptor[]>([]);
  const [metricsLoaded, setMetricsLoaded] = useState(false);

  useEffect(() => {
    // Fetch available metrics on mount
    import("@/app/lib/metrics").then(({ describeMetrics }) => {
      describeMetrics().then(metrics => {
        setAvailableMetrics(metrics);
        setMetricsLoaded(true);
      }).catch(() => {
        // If listing fails, we can still try to run the query, or let the user try.
        setMetricsLoaded(true);
      });
    });
  }, []);

  useEffect(() => {
    // Wait for metrics to be loaded before auto-running
    if (!metricsLoaded) return;

    if (autoRun) {
      // If the current query is empty, pick first available metric.
      let queryToRun = metricQuery;
      if (!metricQuery.expression && availableMetrics.length > 0) {
        const firstMetric = availableMetrics[0];
        // We update the state, but safely execute the modified query directly
        setMetricQuery(q => ({ ...q, expression: firstMetric.name }));

        // Auto-select visualization type based on metric type
        if (firstMetric.type === "histogram") {
          setVisualizationType("histogram");
        } else if (firstMetric.type === "gauge") {
          setVisualizationType("gauge");
        } else {
          setVisualizationType("timeseries");
        }

        queryToRun = { ...metricQuery, expression: firstMetric.name };
      }
      void executeMetricQuery(queryToRun);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricsLoaded]); // Run once when metrics are loaded (or if autoRun changes, but we treat it as init)


  const runMetricQuery = async () => {
    await executeMetricQuery(metricQuery);
  };

  const resetToDefaults = () => {
    const defaultQuery = deriveMetricQuery();
    setMetricQuery(defaultQuery);
    setAggregation("");
    setGroupBy("");
    setVisualizationType("timeseries");
    // Optionally auto-run after reset
    void executeMetricQuery(defaultQuery);
  };

  // Check if current state matches default state (approximately)
  const isDefaultState = () => {
    // Logic for "is default" might be complex due to timestamps continuously changing.
    // We'll treat "default" as "metricName is empty" and aggregation/group by are empty.
    return (
      !metricQuery.expression &&
      !aggregation &&
      !groupBy &&
      !metricQuery.scope
    );
  };
  return (
    <Section
      id="metrics-panel"
      title="Query"
      action={
        <div className="flex gap-2">
          {!readOnly && !isDefaultState() && (
            <button
              type="button"
              onClick={resetToDefaults}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Reset to Default
            </button>
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={runMetricQuery}
              className="rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
            >
              Run query
            </button>
          )}
        </div>
      }
    >
      {!readOnly && (
        <>
          <Field
            label="Metric Name"
            input={
              <MetricAutocomplete
                value={metricQuery.expression}
                onChange={(v) => setMetricQuery((q) => ({ ...q, expression: v }))}
                onMetricSelect={(metric) => {
                  if (metric.type === "histogram") {
                    setVisualizationType("histogram");
                  } else if (metric.type === "gauge") {
                    setVisualizationType("gauge");
                  } else {
                    setVisualizationType("timeseries");
                  }
                }}
              />
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Start"
              input={
                <TextInput
                  type="datetime-local"
                  value={metricQuery.start}
                  onChange={(v) => setMetricQuery((q) => ({ ...q, start: v }))}
                />
              }
            />
            <Field
              label="End"
              input={
                <TextInput
                  type="datetime-local"
                  value={metricQuery.end}
                  onChange={(v) => setMetricQuery((q) => ({ ...q, end: v }))}
                />
              }
            />
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-[#1c3134]">
            <span className="font-semibold">Quick ranges:</span>
            {[30, 120, 720].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRangeMinutes(m)}
                className="rounded-full border border-slate-200 bg-white px-2 py-1 transition hover:border-[#55cfd0]"
              >
                last {m >= 60 ? `${m / 60} h` : `${m} m`}
              </button>
            ))}
          </div>
          <Field
            label="Step (seconds)"
            input={
              <TextInput
                type="number"
                value={metricQuery.stepSeconds.toString()}
                onChange={(v) => setMetricQuery((q) => ({ ...q, stepSeconds: Number(v) }))}
                placeholder="30"
              />
            }
          />
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
              <Field
                label="Aggregation (optional)"
                input={
                  <select
                    value={aggregation}
                    onChange={(e) => setAggregation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-[#55cfd0] focus:outline-none focus:ring-2 focus:ring-[#55cfd0]/20"
                  >
                    <option value="">None</option>
                    <option value="avg">Average</option>
                    <option value="sum">Sum</option>
                    <option value="max">Maximum</option>
                    <option value="min">Minimum</option>
                    <option value="count">Count</option>
                    <option value="rate">Rate</option>
                  </select>
                }
              />
              <Field
                label="Group By (comma-separated labels)"
                input={
                  <TextInput
                    value={groupBy}
                    onChange={setGroupBy}
                    placeholder="status,method"
                  />
                }
              />

              <div className="border-t border-slate-200 pt-4">
                <ScopeInputs
                  scope={metricQuery.scope}
                  onChange={(scope) => setMetricQuery((q) => ({ ...q, scope }))}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Visualization:</span>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(["timeseries", "histogram", "gauge"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVisualizationType(type)}
                  className={`rounded px-3 py-1 text-xs font-medium transition ${visualizationType === type
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            {visualizationType === "gauge" && (
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Value:</span>
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(["latest", "avg", "min", "max"] as const).map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setGaugeStatistic(stat)}
                      className={`rounded px-3 py-1 text-xs font-medium transition ${gaugeStatistic === stat
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 justify-end">
            {metricState.error ? null : null} {/* Error handled by EmptyState below */}
          </div>
        </>
      )}
      <div className="flex max-h-80 xl:max-h-[30rem] 2xl:max-h-[40rem] flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        {metricState.error ? (
          <EmptyState
            title="Error loading metrics"
            description={metricState.error}
            variant="error"
            action={{ label: "Retry", onClick: runMetricQuery }}
          />
        ) : (metricState.loading || integrationsLoading) && metricSeries.length === 0 ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white/80 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 rounded bg-slate-200" />
                  <div className="h-5 w-20 rounded-full bg-slate-200" />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="h-16 rounded-lg bg-slate-200" />
                  ))}
                </div>
                <div className="mt-3 h-16 rounded bg-slate-200" />
              </div>
            ))}
          </>
        ) : !hasIntegrations ? (
          <EmptyState
            title="No integration configured"
            description="Connect an integration to start monitoring metrics."
            variant="no-integration"
            action={{ label: "Configure Integration", onClick: () => router.push("/settings") }} // Note: router needs to be available
          />
        ) : metricSeries.length === 0 ? (
          <EmptyState
            title={readOnly ? "No metric data" : isDefaultState() ? "No metrics found" : "No matching metrics"}
            description={readOnly ? "No metrics to display." : isDefaultState() ? "There are no metrics for the default query." : "Try adjusting your filters or query."}
            variant={readOnly ? "default" : "no-data"}
            action={!readOnly && !isDefaultState() ? { label: "Reset to Default", onClick: resetToDefaults } : { label: "Run Query", onClick: runMetricQuery }}
          />
        ) : (
          metricSeries.map((series) => {
            const stats = summarize(series);
            return (
              <div key={series.name} className="animate-fade-in rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 to-sky-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{series.name}</span>
                    <Badge label={`${series.points.length} points`} variant="info" size="sm" />
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2 shadow-sm">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">Latest</p>
                      <p className="mt-1 text-lg font-bold text-emerald-900">{formatNumber(stats.latest ? stats.latest.value : null)}</p>
                      <p className="mt-0.5 text-[10px] text-emerald-600">{stats.latest ? formatTimestampShort(stats.latest.timestamp) : ""}</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-sky-50 px-3 py-2 shadow-sm">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600">Min</p>
                      <p className="mt-1 text-lg font-bold text-blue-900">{formatNumber(stats.min)}</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 px-3 py-2 shadow-sm">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-purple-600">Max</p>
                      <p className="mt-1 text-lg font-bold text-purple-900">{formatNumber(stats.max)}</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 px-3 py-2 shadow-sm">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600">Avg</p>
                      <p className="mt-1 text-lg font-bold text-amber-900">{formatNumber(stats.avg)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    {visualizationType === "timeseries" && (
                      <>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Time Series ({series.points.length} points)
                        </p>
                        <TimeSeriesChart points={series.points} name={series.name} color="#14b8a6" />
                      </>
                    )}
                    {visualizationType === "histogram" && (
                      <>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Distribution ({series.points.length} points)
                        </p>
                        <Histogram values={series.points.map((p) => p.value)} color="#14b8a6" />
                      </>
                    )}
                    {visualizationType === "gauge" && (
                      <div className="py-4">
                        <Gauge
                          value={
                            gaugeStatistic === "latest"
                              ? (stats.latest ? stats.latest.value : 0)
                              : (stats[gaugeStatistic] || 0)
                          }
                          min={stats.min || 0}
                          max={stats.max || 100}
                          label={`${gaugeStatistic.charAt(0).toUpperCase() + gaugeStatistic.slice(1)} Value`}
                          size="lg"
                        />
                      </div>
                    )}
                  </div>

                  {series.url ? (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <a
                        href={series.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#8fdede] bg-white px-2 py-1 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:text-[#0b1517]"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in Tool
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Section>
  );
}
