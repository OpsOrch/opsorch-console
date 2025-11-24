"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CopilotAnswer, CopilotReferences } from "@/app/lib/types";
import { useAsyncState } from "@/app/lib/hooks";
import { Accordion, Badge, Field, Pill, Section, TextArea } from "@/app/lib/ui";
import { ConfidenceBar } from "@/app/components/copilot/ConfidenceBar";
import { ResponseDetailsContent } from "@/app/components/copilot/ResponseDetails";
import { parseJsonString, stringifyData } from "@/app/lib/utils";

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

  const derivedReferences =
    answer.references ||
    (derivedData && typeof derivedData === "object" && (derivedData as { references?: CopilotReferences }).references);

  return {
    conclusion: derivedConclusion,
    evidence: answer.evidence,
    missing: answer.missing,
    actions: answer.actions,
    references: derivedReferences,
    data: derivedData,
    confidence: answer.confidence,
    chatId: derivedChatId,
  };
}

function makeId(role: CopilotTurn["role"]) {
  return `${Date.now()}-${role}-${Math.random().toString(36).slice(2, 7)}`;
}

export function CopilotPanel({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [question, setQuestion] = useState("");
  const [chatId, setChatId] = useState<string | undefined>(initialChatId);
  const [turns, setTurns] = useState<CopilotTurn[]>([]);
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
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

    // Close all accordions when sending a new message
    setOpenAccordions(new Set());

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

      const newChatId = answer.chatId;
      setChatId((prev) => (newChatId ? newChatId : prev));
      setTurns((prev) => [...prev, { id: makeId("copilot"), role: "copilot", text: conclusionText, answer: { ...answer, conclusion: conclusionText } }]);
      state.succeed();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTurns((prev) => [...prev, { id: makeId("error"), role: "error", text: message }]);
      state.fail(err);
    }
  };

  const loadChat = async (id: string) => {
    state.start();
    try {
      const res = await fetch(`/api/copilot/chats/${id}`);
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      const data = await res.json();
      const conversation = data.conversation;

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const mappedTurns: CopilotTurn[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conversation.turns.forEach((t: any) => {
        mappedTurns.push({
          id: makeId("user"),
          role: "user",
          text: t.userMessage,
        });

        if (t.assistantResponse) {
          mappedTurns.push({
            id: makeId("copilot"),
            role: "copilot",
            text: t.assistantResponse,
            answer: {
              conclusion: t.assistantResponse,
              chatId: conversation.chatId,
              // Map tool results to data so they can be inspected if needed
              data: t.toolResults,
            },
          });
        }
      });

      setChatId(conversation.chatId);
      setTurns(mappedTurns);
      state.succeed();
    } catch (err) {
      state.fail(err);
    }
  };

  useEffect(() => {
    if (initialChatId) {
      loadChat(initialChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId]);

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
        <div ref={historyRef} className="grid max-h-[32rem] gap-4 overflow-y-auto pr-1">
          {turns.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e9fcfc]">
                <svg className="h-6 w-6 text-[#55cfd0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">Start a conversation</p>
              <p className="mt-1 text-xs text-slate-500">Ask about incidents, logs, metrics, tickets, or services</p>
            </div>
          ) : (
            turns.map((turn) => {
              const isUser = turn.role === "user";
              const isCopilot = turn.role === "copilot";
              const isError = turn.role === "error";
              return (
                <div key={turn.id} className={`animate-fade-in flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex max-w-full flex-col gap-3 rounded-2xl border px-4 py-3 shadow-md transition-all hover:shadow-lg sm:max-w-2xl ${isUser
                      ? "border-[#c2f0f0] bg-gradient-to-br from-[#e9fcfc] to-[#f4fcfc]"
                      : isCopilot
                        ? "border-slate-200 bg-white"
                        : "border-rose-200 bg-rose-50"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {isUser ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        ) : isCopilot ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#55cfd0] to-[#3fb8b8] text-white shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {isUser ? "You" : isCopilot ? "Copilot" : "Error"}
                        </span>
                      </div>
                      {isCopilot && typeof turn.answer?.confidence === "number" ? (
                        <ConfidenceBar confidence={turn.answer.confidence} />
                      ) : null}
                    </div>

                    <div className={`rounded-xl px-3 py-2.5 ${isCopilot ? "bg-slate-50/50" : "bg-white/60"}`}>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-900">{turn.answer?.conclusion || turn.text}</p>
                    </div>

                    {isError ? null : isCopilot && turn.answer ? (
                      <Accordion
                        title="View Details"
                        isOpen={openAccordions.has(turn.id)}
                        onToggle={(isOpen) => {
                          setOpenAccordions((prev) => {
                            const next = new Set(prev);
                            if (isOpen) {
                              next.add(turn.id);
                            } else {
                              next.delete(turn.id);
                            }
                            return next;
                          });
                        }}
                      >
                        <ResponseDetailsContent answer={turn.answer} />
                      </Accordion>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
          {state.loading && (
            <div className="order-last animate-fade-in flex items-center gap-3 self-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-50 to-sky-50">
                <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Copilot is thinking</span>
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-teal-500" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-teal-500" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-teal-500" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
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
