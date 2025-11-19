"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CopilotAnswer, CopilotReferences, LogReference, MetricReference } from "@/app/lib/types";
import { useAsyncState } from "@/app/lib/hooks";
import { Field, Pill, Section, TextArea } from "@/app/lib/ui";

type CopilotTurn = {
  id: string;
  role: "user" | "copilot" | "error";
  text: string;
  answer?: CopilotAnswer;
};

type CopilotApiResponse = CopilotAnswer & { answer?: CopilotAnswer };

type CopilotContentItem = { type?: string; text?: string };

function getChatId(candidate?: CopilotAnswer) {
  return candidate?.chatId;
}

function parseJsonString(text?: unknown) {
  if (typeof text !== "string") return undefined;
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function normalizeAnswer(payload: CopilotApiResponse): CopilotAnswer {
  const answer = payload.answer ?? payload;
  const structured = (answer as { structuredContent?: unknown }).structuredContent;
  const contentArray = (answer as { content?: CopilotContentItem[] }).content;
  const parsedDataField = parseJsonString((answer as { data?: unknown }).data);
  const structuredConclusion =
    structured && typeof structured === "object" && (structured as { conclusion?: unknown }).conclusion;

  const derivedConclusion =
    answer.conclusion ||
    (typeof structuredConclusion === "string" ? structuredConclusion : undefined) ||
    (structured && typeof structured === "object" ? stringifyData(structured) : undefined) ||
    "Copilot did not return a conclusion.";

  const derivedData =
    parsedDataField ??
    answer.data ??
    structured ??
    contentArray;

  const derivedChatId = getChatId(answer) || getChatId(payload);

  return {
    conclusion: derivedConclusion,
    evidence: answer.evidence,
    missing: answer.missing,
    actions: answer.actions,
    links: answer.links,
    references: answer.references,
    data: derivedData,
    confidence: answer.confidence,
    chatId: derivedChatId,
  };
}

function buildMetricHref(reference: MetricReference) {
  const params = new URLSearchParams();
  if (reference.expression) params.set("expression", reference.expression);
  if (reference.start) params.set("start", reference.start);
  if (reference.end) params.set("end", reference.end);
  if (reference.step) params.set("step", reference.step);
  if (reference.scope) params.set("scope", reference.scope);
  const query = params.toString();
  return query ? `/metrics?${query}` : "/metrics";
}

function buildLogHref(reference: LogReference) {
  const params = new URLSearchParams();
  if (reference.query) params.set("query", reference.query);
  if (reference.start) params.set("start", reference.start);
  if (reference.end) params.set("end", reference.end);
  if (reference.service) params.set("service", reference.service);
  if (reference.scope) params.set("scope", reference.scope);
  const query = params.toString();
  return query ? `/logs?${query}` : "/logs";
}

function ReferenceLinks({
  references,
}: {
  references?: CopilotReferences;
}) {
  if (!references) return null;
  const { incidents, services, metrics, logs, tickets } = references;
  if (!incidents?.length && !services?.length && !metrics?.length && !logs?.length && !tickets?.length) return null;

  const renderList = (items: React.ReactNode[]) => (
    <ul className="mt-1 flex flex-wrap gap-2 text-xs text-[#0f5f66]">
      {items.map((node, idx) => (
        <li key={idx}>{node}</li>
      ))}
    </ul>
  );

  return (
    <div className="text-xs text-slate-700">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">References</p>
      {incidents?.length ? renderList(incidents.map((id) => (
        <a
          key={`inc-${id}`}
          href={`/incidents/${id}`}
          className="inline-flex items-center gap-1 rounded-full border border-[#cfeff0] bg-[#f4fcfc] px-3 py-1 font-semibold text-[#0f5f66] hover:border-[#55cfd0] hover:text-[#0b2f33]"
        >
          Incident {id}
        </a>
      ))) : null}
      {services?.length ? renderList(services.map((svc) => (
        <a
          key={`svc-${svc}`}
          href={`/services`}
          className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-semibold text-[#0f5f66] hover:border-[#55cfd0] hover:text-[#0b2f33]"
        >
          Service {svc}
        </a>
      ))) : null}
      {tickets?.length
        ? renderList(
            tickets.map((t) => {
              const label = `Ticket ${t}`;
              const href = t ? `/tickets?ticketId=${encodeURIComponent(t)}` : "/tickets";
              return (
                <a
                  key={`ticket-${t}`}
                  href={href}
                  className="inline-flex items-center gap-1 rounded-full border border-[#cfeff0] bg-[#f4fcfc] px-3 py-1 text-xs font-semibold text-[#0f5f66] transition hover:border-[#55cfd0] hover:text-[#0b2f33]"
                  title="Open in tickets"
                >
                  {label}
                </a>
              );
            }),
          )
        : null}
      {metrics?.length
        ? renderList(
            metrics.map((m, idx) => {
              const content = `Metric ${m.expression}`;
              const tooltip = `Window: ${m.start || "?"} → ${m.end || "?"}${m.scope ? ` scope=${m.scope}` : ""}`;
              return (
                <a
                  key={`metric-${idx}`}
                  href={buildMetricHref(m)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#cfeff0] bg-[#f4fcfc] px-3 py-1 text-xs font-semibold text-[#0f5f66] transition hover:border-[#55cfd0] hover:text-[#0b2f33]"
                  title={`Open in metrics • ${tooltip}`}
                >
                  {content}
                </a>
              );
            }),
          )
        : null}
      {logs?.length
        ? renderList(
            logs.map((l, idx) => {
              const content = `Logs ${l.query}`;
              const tooltip = `Window: ${l.start || "?"} → ${l.end || "?"}${l.service ? ` svc=${l.service}` : ""}${l.scope ? ` scope=${l.scope}` : ""}`;
              return (
                <a
                  key={`log-${idx}`}
                  href={buildLogHref(l)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#cfeff0] bg-[#f4fcfc] px-3 py-1 text-xs font-semibold text-[#0f5f66] transition hover:border-[#55cfd0] hover:text-[#0b2f33]"
                  title={`Open in logs • ${tooltip}`}
                >
                  {content}
                </a>
              );
            }),
          )
        : null}
    </div>
  );
}

function makeId(role: CopilotTurn["role"]) {
  return `${Date.now()}-${role}-${Math.random().toString(36).slice(2, 7)}`;
}

function stringifyData(data: unknown) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (err) {
    return `Unable to render data: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export function CopilotPanel() {
  const [question, setQuestion] = useState("");
  const [chatId, setChatId] = useState<string | undefined>();
  const [turns, setTurns] = useState<CopilotTurn[]>([]);
  const state = useAsyncState();
  const historyRef = useRef<HTMLDivElement | null>(null);

  const questionPlaceholder = useMemo(
    () => (turns.length > 0 ? undefined : "Summarize the last sev1 incidents and correlate logs/metrics for checkout-service"),
    [turns.length],
  );
  const showSessionStamp = Boolean(chatId);

  const ask = async () => {
    const trimmed = question.trim();
    if (!trimmed || state.loading) return;

    setTurns((prev) => [...prev, { id: makeId("user"), role: "user", text: trimmed }]);
    setQuestion("");
    state.start();

    try {
      const payload: Record<string, string> = { message: trimmed };
      if (chatId) {
        payload.chatId = chatId;
      }

      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || res.statusText);
      }

      const data = (await res.json()) as CopilotApiResponse;
      const answer = normalizeAnswer(data);
      const conclusionText = answer.conclusion || "No conclusion returned.";
      setChatId((prev) => (answer.chatId ? answer.chatId : prev));
      setTurns((prev) => [...prev, { id: makeId("copilot"), role: "copilot", text: conclusionText, answer: { ...answer, conclusion: conclusionText } }]);
      state.succeed();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTurns((prev) => [...prev, { id: makeId("error"), role: "error", text: message }]);
      state.fail(err);
    }
  };

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTo({ top: historyRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [turns]);

  const canAsk = question.trim().length > 0 && !state.loading;

  return (
    <div className="relative">
      <Section
      title="Copilot"
      action={
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setChatId(undefined);
              setTurns([]);
            }}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            Reset
          </button>
        </div>
      }
    >
      <div ref={historyRef} className="grid max-h-[32rem] gap-3 overflow-y-auto pr-1">
        {turns.length === 0 ? (
          <p className="text-sm text-slate-600">Start typing to ask about incidents, logs, metrics, tickets, or messaging.</p>
        ) : (
          turns.map((turn) => {
            const isUser = turn.role === "user";
            const isCopilot = turn.role === "copilot";
            const isError = turn.role === "error";
            return (
              <div key={turn.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex max-w-full flex-col gap-2 rounded-2xl border px-3 py-2 shadow-sm sm:max-w-2xl ${
                    isUser
                      ? "border-[#c2f0f0] bg-[#e9fcfc]"
                      : isCopilot
                        ? "border-slate-200 bg-white"
                        : "border-rose-100 bg-rose-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    <span>{isUser ? "You" : isCopilot ? "Copilot" : "Error"}</span>
                    {isCopilot && typeof turn.answer?.confidence === "number" ? (
                      <Pill label={`Confidence ${(turn.answer.confidence * 100).toFixed(0)}%`} tone="default" />
                    ) : null}
                  </div>

                  <div className={`rounded-2xl px-3 py-2 ${isCopilot ? "bg-[#f6fbfb]" : "bg-white/80"}`}>
                    <p className="text-sm text-slate-900 whitespace-pre-line">{turn.answer?.conclusion || turn.text}</p>
                  </div>

                  {isError ? null : isCopilot && turn.answer ? (
                    <details className="group rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                      <summary className="flex cursor-pointer items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        View details
                        <span className="text-[10px] text-slate-500 group-open:rotate-180">▼</span>
                      </summary>
                      <div className="mt-2 space-y-3">
                        {turn.answer.evidence?.length ? (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Evidence</p>
                            <ul className="mt-1 grid gap-1 text-xs text-slate-700">
                              {turn.answer.evidence.map((item, idx) => (
                                <li key={idx} className="rounded border border-slate-200 bg-white px-2 py-1">
                                  {(() => {
                                    if (typeof item === "string") {
                                      const parsed = parseJsonString(item);
                                      if (parsed) {
                                        return (
                                          <pre className="max-h-48 max-w-full overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-800">
                                            {stringifyData(parsed)}
                                          </pre>
                                        );
                                      }
                                      return <span className="break-words">{item}</span>;
                                    }
                                    return (
                                      <pre className="max-h-48 max-w-full overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-800">
                                        {stringifyData(item)}
                                      </pre>
                                    );
                                  })()}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {turn.answer.missing?.length ? (
                          <div className="text-xs text-slate-700">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Missing</p>
                            <p>{turn.answer.missing.join(", ")}</p>
                          </div>
                        ) : null}

                        {turn.answer.links?.length ? (
                          <div className="text-xs text-slate-700">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Links</p>
                            <ul className="mt-1 grid gap-1">
                              {turn.answer.links.map((link) => (
                                <li key={`${link.label}-${link.url}`} className="truncate">
                                  <a href={link.url} className="text-[#0f5f66] hover:underline" target="_blank" rel="noreferrer">
                                    {link.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <ReferenceLinks references={turn.answer.references} />

                        {turn.answer.actions?.length ? (
                          <div className="text-xs text-slate-700">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Actions</p>
                            <ul className="mt-1 grid gap-1">
                              {turn.answer.actions.map((action, idx) => (
                                <li key={`${action.type}-${idx}`} className="rounded border border-slate-200 bg-white px-2 py-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-800">{action.label}</span>
                                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                                      {action.type}
                                    </span>
                                  </div>
                                  {action.payload ? (
                                    <pre className="mt-1 max-h-48 max-w-full overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
                                      {stringifyData(action.payload)}
                                    </pre>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {turn.answer.data ? (
                          <div className="text-xs text-slate-700">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Raw data</p>
                            <pre className="mt-1 max-h-[28rem] max-w-full overflow-auto whitespace-pre-wrap break-words rounded border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-800">
                              {stringifyData(turn.answer.data)}
                            </pre>
                          </div>
                        ) : null}

                        <div className="text-xs text-slate-700">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Full copilot answer</p>
                          <pre className="mt-1 max-h-[28rem] max-w-full overflow-auto whitespace-pre-wrap break-words rounded border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-800">
                            {stringifyData(turn.answer)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 space-y-3">
        <Field
          label="Ask a question"
          input={
            <TextArea
              value={question}
              onChange={setQuestion}
              placeholder={questionPlaceholder}
            />
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={ask}
            disabled={!canAsk}
            className="rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8] disabled:cursor-not-allowed disabled:bg-[#b7eded]"
          >
            {state.loading ? "Asking Copilot..." : "Ask Copilot"}
          </button>
          {state.error ? <Pill label={state.error} tone="error" /> : null}
        </div>
      </div>
      </Section>
      {showSessionStamp ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-2 text-[7px] font-semibold uppercase tracking-[0.3em] text-slate-300 opacity-55"
        >
          {chatId}
        </span>
      ) : null}
    </div>
  );
}
