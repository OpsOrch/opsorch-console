import { useCallback, useEffect, useRef, useState } from "react";
import { useAsyncState } from "@/app/lib/hooks";
import { requestJSON } from "@/app/lib/api";
import { LogEntry, LogReference } from "@/app/lib/types";
import { Field, Pill, Section, TextInput } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";
type LogsPanelProps = {
  initialReference?: LogReference;
  autoRun?: boolean;
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
    return <p className="mt-1 whitespace-pre-wrap text-slate-500">No message</p>;
  }

  if (typeof message === "string") {
    const parsed = parseJsonMessage(message);
    if (parsed !== null) {
      return (
        <pre className="mt-1 whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-800">
          {formatJson(parsed)}
        </pre>
      );
    }

    return <p className="mt-1 whitespace-pre-wrap text-slate-800">{message}</p>;
  }

  if (typeof message === "object") {
    return (
      <pre className="mt-1 whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-800">
        {formatJson(message)}
      </pre>
    );
  }

  return <p className="mt-1 whitespace-pre-wrap text-slate-800">{String(message)}</p>;
};

const toInputTimestamp = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 16);
};

const deriveLogQuery = (reference?: LogReference) => {
  const defaultEnd = new Date();
  const defaultStart = new Date(defaultEnd.getTime() - 60 * 60 * 1000);
  return {
    query: reference?.query || "service:error OR level:error",
    start: toInputTimestamp(reference?.start) || defaultStart.toISOString().slice(0, 16),
    end: toInputTimestamp(reference?.end) || defaultEnd.toISOString().slice(0, 16),
    limit: "100",
  };
};

export function LogsPanel({ initialReference, autoRun = false }: LogsPanelProps = {}) {
  const logState = useAsyncState();
  const [logQuery, setLogQuery] = useState(() => deriveLogQuery(initialReference));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { start, succeed, fail } = logState;
  const autoRunRef = useRef(autoRun);

  const setRangeMinutes = (mins: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - mins * 60 * 1000);
    setLogQuery((q) => ({ ...q, start: start.toISOString().slice(0, 16), end: end.toISOString().slice(0, 16) }));
  };

  const executeLogQuery = useCallback(async (query: typeof logQuery) => {
    start();
    try {
      const payload: Record<string, unknown> = {
        query: query.query,
        start: new Date(query.start).toISOString(),
        end: new Date(query.end).toISOString(),
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
  }, [fail, setLogs, start, succeed]);

  const runLogQuery = async () => {
    await executeLogQuery(logQuery);
  };

  useEffect(() => {
    if (!autoRunRef.current) return;
    autoRunRef.current = false;
    const frame = requestAnimationFrame(() => {
      void executeLogQuery(logQuery);
    });
    return () => cancelAnimationFrame(frame);
  }, [executeLogQuery, logQuery]);

  return (
    <Section
      id="logs-panel"
      title="Logs"
      description="Run log searches over the connected source." 
      action={
        <button
          type="button"
          onClick={runLogQuery}
          className="rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-medium text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0]"
        >
          Run query
        </button>
      }
    >
      <Field
        label="Query"
        input={
          <TextInput
            value={logQuery.query}
            onChange={(v) => setLogQuery((q) => ({ ...q, query: v }))}
            placeholder="level:error"
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
            className="rounded-full border border-[#8fdede] bg-white px-2 py-1 transition hover:border-[#55cfd0]"
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
            placeholder="100"
            type="number"
          />
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runLogQuery}
          className="rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
        >
          {logState.loading ? "Querying..." : "Query logs"}
        </button>
        {logState.error ? <Pill label={logState.error} tone="error" /> : null}
      </div>
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
        {logs.length === 0 ? (
          <p className="text-slate-500">No log results yet.</p>
        ) : (
          logs.map((entry, idx) => (
            <div key={`${entry.timestamp}-${idx}`} className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">{entry.severity || "info"}</span>
                <span className="text-[11px] text-slate-500">{formatDate(entry.timestamp)}</span>
              </div>
              {renderLogMessage(entry.message)}
            </div>
          ))
        )}
      </div>
    </Section>
  );
}
