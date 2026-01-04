import { useCallback, useEffect, useState } from "react";
import { useAsyncState } from "@/app/lib/hooks";
import { requestJSON } from "@/app/lib/api";
import { LogEntry, LogReference } from "@/app/lib/types";
import { CodeBlock, Field, Pill, Section, TextInput } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";
import { DEFAULT_QUERY_LIMIT } from "@/app/lib/consts";
import { ScopeInputs } from "@/app/components/ScopeInputs";
import { EmptyState } from "@/app/components/EmptyState";

type LogsPanelProps = {
  initialReference?: LogReference;
  autoRun?: boolean;
  readOnly?: boolean;
};

const parseJsonMessage = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const formatJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const renderLogMessage = (message: LogEntry["message"]) => {
  if (message === null || message === undefined) {
    return <p className="mt-1 text-xs text-slate-500">No message</p>;
  }

  if (typeof message === "string") {
    const parsed = parseJsonMessage(message);
    if (parsed !== null) {
      return <div className="mt-2"><CodeBlock code={formatJson(parsed)} language="json" /></div>;
    }
    return <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{message}</p>;
  }

  if (typeof message === "object") {
    return <div className="mt-2"><CodeBlock code={formatJson(message)} language="json" /></div>;
  }

  return <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{String(message)}</p>;
};

const getSeverityColor = (severity?: string) => {
  const sev = (severity || "info").toLowerCase();
  if (sev.includes("error") || sev.includes("fatal") || sev.includes("critical")) return "rose";
  if (sev.includes("warn")) return "amber";
  return "sky";
};

const toInputTimestamp = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const deriveLogQuery = (reference?: LogReference) => {
  const defaultEnd = new Date();
  const defaultStart = new Date(defaultEnd.getTime() - 60 * 60 * 1000);
  const defaultSearch = reference?.expression?.search || "";
  return {
    query: defaultSearch,
    filters: reference?.expression?.filters || [],
    severityIn: reference?.expression?.severityIn || [],
    start: toInputTimestamp(reference?.start) || toInputTimestamp(defaultStart.toISOString()) || "",
    end: toInputTimestamp(reference?.end) || toInputTimestamp(defaultEnd.toISOString()) || "",
    limit: String(DEFAULT_QUERY_LIMIT),
    scope: reference?.scope,
  };
};

export function LogsPanel({ initialReference, autoRun = false, readOnly = false }: LogsPanelProps = {}) {
  const logState = useAsyncState();
  // Initialize state once from props. Changing props won't reset state unless the component is remounted (key changes).
  const [logQuery, setLogQuery] = useState(() => deriveLogQuery(initialReference));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initialReference?.expression?.severityIn?.length || initialReference?.scope));
  const [severityIn, setSeverityIn] = useState(() => initialReference?.expression?.severityIn?.join(", ") || "");
  const { start, succeed, fail } = logState;

  const setRangeMinutes = (mins: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - mins * 60 * 1000);
    setLogQuery((q) => ({ ...q, start: start.toISOString().slice(0, 16), end: end.toISOString().slice(0, 16) }));
  };

  const executeLogQuery = useCallback(async (query: typeof logQuery) => {
    start();
    try {
      const expression: Record<string, unknown> = { search: query.query || "" };
      if (severityIn) expression.severityIn = severityIn.split(",").map(s => s.trim()).filter(Boolean);
      const payload: Record<string, unknown> = {
        expression,
        start: new Date(query.start).toISOString(),
        end: new Date(query.end).toISOString(),
        scope: query.scope,
      };
      const limitVal = Number(query.limit);
      if (!Number.isNaN(limitVal) && query.limit) {
        payload.limit = limitVal;
      }
      const res = await requestJSON<LogEntry[]>("/logs/query", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setLogs(res);
      succeed();
    } catch (err) {
      fail(err);
    }
  }, [fail, setLogs, start, succeed, severityIn]);

  useEffect(() => {
    if (autoRun) {
      void executeLogQuery(logQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // logQuery is stable on mount, so this runs once effectively if autoRun is true

  const runLogQuery = async () => {
    await executeLogQuery(logQuery);
  };

  const resetToDefaults = () => {
    const defaultQuery = deriveLogQuery();
    setLogQuery(defaultQuery);
    setSeverityIn("");
    void executeLogQuery(defaultQuery);
  };

  const isDefaultQuery = () => {
    return (
      !logQuery.query &&
      !severityIn &&
      !logQuery.scope &&
      logQuery.limit === String(DEFAULT_QUERY_LIMIT)
    );
  };



  return (
    <Section
      id="logs-panel"
      title="Search"
      action={
        !readOnly ? (
          <div className="flex gap-2">
            {!isDefaultQuery() && (
              <button
                type="button"
                onClick={resetToDefaults}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Reset to Default
              </button>
            )}
            <button
              type="button"
              onClick={runLogQuery}
              className="rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
            >
              Run query
            </button>
          </div>
        ) : null
      }
    >
      {!readOnly && (
        <>
          <Field
            label="Search"
            input={
              <TextInput
                value={logQuery.query}
                onChange={(v) => setLogQuery((q) => ({ ...q, query: v }))}
                placeholder="error connection timeout"
              />
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Start"
              input={
                <TextInput
                  type="datetime-local"
                  value={logQuery.start}
                  onChange={(v) => setLogQuery((q) => ({ ...q, start: v }))}
                />
              }
            />
            <Field
              label="End"
              input={
                <TextInput
                  type="datetime-local"
                  value={logQuery.end}
                  onChange={(v) => setLogQuery((q) => ({ ...q, end: v }))}
                />
              }
            />
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-[#1c3134]">
            <span className="font-semibold">Quick ranges:</span>
            {[15, 60, 360].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRangeMinutes(m)}
                className="rounded-full border border-slate-200 bg-white px-2 py-1 transition hover:border-[#55cfd0]"
              >
                last {m >= 60 ? `${m / 60}h` : `${m}m`}
              </button>
            ))}
          </div>
          <Field
            label="Limit"
            input={
              <TextInput
                value={logQuery.limit}
                onChange={(v) => setLogQuery((q) => ({ ...q, limit: v }))}
                placeholder="20"
                type="number"
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
                label="Severity Filter (comma-separated)"
                input={
                  <TextInput
                    value={severityIn}
                    onChange={setSeverityIn}
                    placeholder="error,critical,warning"
                  />
                }
              />

              <div className="border-t border-slate-200 pt-4">
                <ScopeInputs
                  scope={logQuery.scope}
                  onChange={(scope) => setLogQuery((q) => ({ ...q, scope }))}
                />
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 justify-end">
            {logState.error ? <Pill label={logState.error} tone="error" /> : null}
          </div>
        </>
      )}
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        {logState.error ? (
          <EmptyState
            title="Error loading logs"
            description={logState.error}
            variant="error"
            action={{ label: "Retry", onClick: runLogQuery }}
          />
        ) : logState.loading && logs.length === 0 ? (
          <div className="animate-fade-in space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white/80 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 w-16 rounded bg-slate-200" />
                  <div className="h-3 w-32 rounded bg-slate-200" />
                </div>
                <div className="mt-2 h-3 w-3/4 rounded bg-slate-200" />
                <div className="mt-1 h-3 w-1/2 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title={readOnly ? "No log results" : isDefaultQuery() ? "No logs found" : "No matching logs"}
            description={readOnly ? "No logs to display." : isDefaultQuery() ? "There are no logs in the last hour." : "Try adjusting your search criteria."}
            variant={readOnly ? "default" : "no-data"}
            action={!readOnly && !isDefaultQuery() ? { label: "Reset to Default", onClick: resetToDefaults } : { label: "Run Query", onClick: runLogQuery }}
          />
        ) : (
          logs.map((entry, idx) => {
            const severityColor = getSeverityColor(entry.severity);
            const colorClasses = {
              rose: "border-rose-200 bg-rose-50",
              amber: "border-amber-200 bg-amber-50",
              sky: "border-sky-200 bg-sky-50",
            };
            const textClasses = {
              rose: "text-rose-700",
              amber: "text-amber-700",
              sky: "text-sky-700",
            };
            return (
              <div key={`${entry.timestamp}-${idx}`} className="animate-fade-in rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className={`rounded-t-lg border-b px-4 py-2 ${colorClasses[severityColor]}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold uppercase ${textClasses[severityColor]}`}>
                      {entry.severity || "info"}
                    </span>
                    <span className="text-xs text-slate-600">{formatDate(entry.timestamp)}</span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  {renderLogMessage(entry.message)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Section>
  );
}
