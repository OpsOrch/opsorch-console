import { useCallback, useEffect, useRef, useState } from "react";
import { useAsyncState } from "@/app/lib/hooks";
import { requestJSON } from "@/app/lib/api";
import { MetricSeries, MetricReference } from "@/app/lib/types";
import { Badge, Field, Pill, Section, TextInput, TimeSeriesChart } from "@/app/lib/ui";

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
  return {
    expression: reference?.expression || "up",
    start: toInputTimestamp(reference?.start) || defaultStart.toISOString().slice(0, 16),
    end: toInputTimestamp(reference?.end) || defaultEnd.toISOString().slice(0, 16),
    stepSeconds: reference?.step ?? 30,
    scope: reference?.scope,
  };
};

export function MetricsPanel({ initialReference, autoRun = false, readOnly = false }: MetricsPanelProps = {}) {
  const metricState = useAsyncState();
  const [metricQuery, setMetricQuery] = useState(() => deriveMetricQuery(initialReference));
  const [metricSeries, setMetricSeries] = useState<MetricSeries[]>([]);
  const { start, succeed, fail } = metricState;
  const autoRunRef = useRef(autoRun);



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
      const payload: Record<string, unknown> = {
        expression: query.expression,
        start: new Date(query.start).toISOString(),
        end: new Date(query.end).toISOString(),
        step: resolvedStep, // Send seconds directly
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
  }, [fail, setMetricSeries, start, succeed]);

  const [prevInitialReference, setPrevInitialReference] = useState(initialReference);
  if (initialReference !== prevInitialReference) {
    setPrevInitialReference(initialReference);
    setMetricQuery(deriveMetricQuery(initialReference));
  }

  useEffect(() => {
    if (initialReference && autoRun) {
      const timer = setTimeout(() => {
        void executeMetricQuery(deriveMetricQuery(initialReference));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialReference, executeMetricQuery, autoRun]);

  const runMetricQuery = async () => {
    await executeMetricQuery(metricQuery);
  };

  useEffect(() => {
    if (!autoRunRef.current) return;
    autoRunRef.current = false;
    const frame = requestAnimationFrame(() => {
      void executeMetricQuery(metricQuery);
    });
    return () => cancelAnimationFrame(frame);
  }, [executeMetricQuery, metricQuery]);

  return (
    <Section
      id="metrics-panel"
      title="Metrics"
      description="Run time-series expressions and inspect stats quickly."
      action={
        !readOnly ? (
          <button
            type="button"
            onClick={runMetricQuery}
            className="rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-medium text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0]"
          >
            Run query
          </button>
        ) : null
      }
    >
      {!readOnly && (
        <>
          <Field
            label="Expression"
            input={
              <TextInput
                value={metricQuery.expression}
                onChange={(v) => setMetricQuery((q) => ({ ...q, expression: v }))}
                placeholder="up"
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
                className="rounded-full border border-[#8fdede] bg-white px-2 py-1 transition hover:border-[#55cfd0]"
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
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runMetricQuery}
              className="rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
            >
              {metricState.loading ? "Fetching..." : "Query metrics"}
            </button>
            {metricState.error ? <Pill label={metricState.error} tone="error" /> : null}
          </div>
        </>
      )}
      <div className="flex max-h-80 flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        {metricState.loading && metricSeries.length === 0 ? (
          <div className="animate-fade-in space-y-4">
            {[1, 2].map((i) => (
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
          </div>
        ) : metricSeries.length === 0 ? (
          <div className="animate-fade-in rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
              <svg className="h-6 w-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">No metric data</p>
            <p className="mt-1 text-xs text-slate-500">Run a query to visualize metrics</p>
          </div>
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
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Time Series ({series.points.length} points)
                    </p>
                    <TimeSeriesChart points={series.points} name={series.name} color="#14b8a6" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Section>
  );
}
