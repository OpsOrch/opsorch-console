"use client";

import { useState } from "react";
import { TurnExecutionTrace, IterationTrace, ToolExecutionTrace } from "@/app/lib/types";
import { buildToolExecutionHref } from "@/app/lib/referenceBuilder";

interface ToolExecutionsViewProps {
  trace: TurnExecutionTrace;
}

function formatDuration(ms: number) {
  if (ms >= 10000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms}ms`;
}

export function ToolExecutionsView({ trace }: ToolExecutionsViewProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed by default
  const [openIterations, setOpenIterations] = useState<Set<number>>(() => new Set());

  const totalTools = trace.iterations.reduce(
    (sum, it) => sum + it.toolExecutions.length,
    0
  );
  const totalCacheHits = trace.iterations.reduce(
    (sum, it) => sum + it.toolExecutions.filter((tool) => tool.cacheHit).length,
    0
  );
  const totalFailures = trace.iterations.reduce(
    (sum, it) => sum + it.toolExecutions.filter((tool) => !tool.success).length,
    0
  );
  const totalPlanned = trace.iterations.reduce(
    (sum, it) => sum + it.plannedTools.length,
    0
  );
  const totalAddedTools = trace.iterations.reduce((sum, it) => {
    const added = it.heuristicModifications.flatMap((mod) =>
      mod.action === "inject" ? mod.affectedTools || [] : []
    );
    return sum + added.length;
  }, 0);

  if (totalTools === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Iterations ({trace.iterations.length})
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {formatDuration(trace.totalDurationMs)} total
          </span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {trace.iterations.length} iterations
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {totalPlanned} planned
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
              {totalCacheHits} cached
            </span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
              {totalFailures} failed
            </span>
            {totalAddedTools > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {totalAddedTools} heuristics
              </span>
            )}
          </div>
          {trace.iterations.map((iteration) => (
            <IterationSection
              key={iteration.iterationNumber}
              iteration={iteration}
              totalDurationMs={trace.totalDurationMs}
              isOpen={openIterations.has(iteration.iterationNumber)}
              isLast={iteration.iterationNumber === trace.iterations[trace.iterations.length - 1]?.iterationNumber}
              onToggle={() => {
                setOpenIterations((prev) => {
                  const next = new Set(prev);
                  if (next.has(iteration.iterationNumber)) {
                    next.delete(iteration.iterationNumber);
                  } else {
                    next.add(iteration.iterationNumber);
                  }
                  return next;
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IterationSection({
  iteration,
  totalDurationMs,
  isOpen,
  isLast,
  onToggle,
}: {
  iteration: IterationTrace;
  totalDurationMs: number;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  if (iteration.toolExecutions.length === 0) {
    return null;
  }

  const iterationShare = totalDurationMs
    ? Math.min(100, (iteration.durationMs / totalDurationMs) * 100)
    : 0;
  const failures = iteration.toolExecutions.filter((tool) => !tool.success).length;
  const cacheHits = iteration.toolExecutions.filter((tool) => tool.cacheHit).length;
  const addedTools = Array.from(
    new Set(
      iteration.heuristicModifications.flatMap((mod) =>
        mod.action === "inject" ? mod.affectedTools || [] : []
      )
    )
  );

  return (
    <div className="relative pl-6">
      {!isLast && (
        <span className="absolute left-[11px] top-5 h-full w-px bg-slate-200" aria-hidden="true" />
      )}
      <span
        className={`absolute left-[5px] top-4 h-3.5 w-3.5 rounded-full border-2 ${isOpen ? "border-slate-500 bg-white shadow-[0_0_0_3px_rgba(148,163,184,0.2)]" : "border-slate-300 bg-slate-100"}`}
        aria-hidden="true"
      />
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Iteration {iteration.iterationNumber}
            </span>
            <span className="text-[11px] text-slate-400">
              {formatDuration(iteration.durationMs)} · {iterationShare.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {iteration.toolExecutions.length} tools
            </span>
            {cacheHits > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                {cacheHits} cached
              </span>
            )}
            {failures > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                {failures} failed
              </span>
            )}
            <svg
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <>
            {iteration.plannedTools.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Planned Tools
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {iteration.plannedTools.map((tool, idx) => (
                    <span
                      key={`${tool.name}-${idx}`}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                    >
                      {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {addedTools.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Heuristics
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {addedTools.map((tool, idx) => (
                    <span
                      key={`${tool}-${idx}`}
                      className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 space-y-2">
              {iteration.toolExecutions.map((exec, idx) => (
                <ToolExecutionRow
                  key={idx}
                  execution={exec}
                  iterationDurationMs={iteration.durationMs}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ToolExecutionRow({
  execution,
  iterationDurationMs,
}: {
  execution: ToolExecutionTrace;
  iterationDurationMs: number;
}) {
  const href = buildToolExecutionHref(execution.toolName, execution.arguments || {});
  const argCount = execution.arguments ? Object.keys(execution.arguments).length : 0;
  const percentOfIteration = iterationDurationMs
    ? Math.min(100, (execution.executionTimeMs / iterationDurationMs) * 100)
    : 0;

  return (
    <div className="rounded border border-slate-100 bg-white px-2 py-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {execution.success ? (
            <span className="h-2 w-2 rounded-full bg-emerald-500" title="Success" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-rose-500" title="Failed" />
          )}

          {href ? (
            <a
              href={href}
              className="text-xs font-semibold text-[#0b1517] hover:underline"
              title={`Open ${execution.toolName} in Console`}
            >
              {execution.toolName}
            </a>
          ) : (
            <span className="text-xs font-semibold text-[#0b1517]">
              {execution.toolName}
            </span>
          )}

          {argCount > 0 && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
              {argCount} args
            </span>
          )}

          {execution.cacheHit && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              cached
            </span>
          )}

          {!execution.success && (
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
              failed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{formatDuration(execution.executionTimeMs)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
            {percentOfIteration.toFixed(0)}%
          </span>
        </div>
      </div>

      {execution.error && (
        <p className="mt-1 text-[11px] text-rose-600" title={execution.error}>
          {execution.error.length > 140 ? `${execution.error.slice(0, 140)}...` : execution.error}
        </p>
      )}
    </div>
  );
}
