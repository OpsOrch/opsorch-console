import { useCallback, useEffect, useRef, useState } from "react";
import { useAsyncState } from "@/app/lib/hooks";
import { requestJSON } from "@/app/lib/api";
import { MetricReference, MetricSeries } from "@/app/lib/types";
import { formatDate } from "@/app/lib/utils";
import { Field, Pill, Section, TextInput } from "@/app/lib/ui";

type MetricsPanelProps = {
  initialReference?: MetricReference;
  autoRun?: boolean;
};

const toInputTimestamp = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 16);
};

const parseStepSeconds = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return String(Math.floor(numeric));
  }

  const match = trimmed.match(/^([0-9]+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes)$/i);
  if (match) {
    const raw = Number(match[1]);
    if (Number.isNaN(raw) || raw <= 0) return undefined;
    const unit = match[2].toLowerCase();
    return unit.startsWith("m") ? String(raw * 60) : String(raw);
  }

  return undefined;
};

const deriveMetricQuery = (reference?: MetricReference) => {
  const defaultEnd = new Date();
  const defaultStart = new Date(defaultEnd.getTime() - 30 * 60 * 1000);
  return {
    expression: reference?.expression || "up",
    start: toInputTimestamp(reference?.start) || defaultStart.toISOString().slice(0, 16),
    end: toInputTimestamp(reference?.end) || defaultEnd.toISOString().slice(0, 16),
    stepSeconds: parseStepSeconds(reference?.step) ?? "30",
  };
};

export function MetricsPanel({ initialReference, autoRun = false }: MetricsPanelProps = {}) {
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
      const payload = {
        expression: query.expression,
        start: new Date(query.start).toISOString(),
        end: new Date(query.end).toISOString(),
        step: resolvedStep * 1_000_000_000,
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
        <button
          type="button"
          onClick={runMetricQuery}
          className="rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-medium text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0]"
        >
          Run query
        </button>
      }
    >
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
            last {m >= 60 ? `${m / 60}h` : `${m}m`}
          </button>
        ))}
      </div>
      <Field
        label="Step (seconds)"
        input={
          <TextInput
            type="number"
            value={metricQuery.stepSeconds}
            onChange={(v) => setMetricQuery((q) => ({ ...q, stepSeconds: v }))}
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
      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
        {metricSeries.length === 0 ? (
          <p className="text-slate-500">No metric data yet.</p>
        ) : (
          metricSeries.map((series) => {
            const stats = summarize(series);
            const maxVal = Math.max(...series.points.map((p) => p.value), 1);
            return (
              <div key={series.name} className="rounded-lg border border-slate-200 bg-white/80 px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{series.name}</span>
                  <Pill label={`${series.points.length} points`} />
                </div>

                <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-slate-600">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                    <p className="uppercase tracking-wide text-[10px] text-slate-500">Latest</p>
                    <p className="text-sm font-semibold text-slate-900">{formatNumber(stats.latest ? stats.latest.value : null)}</p>
                    <p className="text-[10px] text-slate-500">{stats.latest ? formatTimestampShort(stats.latest.timestamp) : ""}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                    <p className="uppercase tracking-wide text-[10px] text-slate-500">Min</p>
                    <p className="text-sm font-semibold text-slate-900">{formatNumber(stats.min)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                    <p className="uppercase tracking-wide text-[10px] text-slate-500">Max</p>
                    <p className="text-sm font-semibold text-slate-900">{formatNumber(stats.max)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                    <p className="uppercase tracking-wide text-[10px] text-slate-500">Avg</p>
                    <p className="text-sm font-semibold text-slate-900">{formatNumber(stats.avg)}</p>
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
    </Section>
  );
}
