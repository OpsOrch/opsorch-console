import React from "react";
import { Accordion, Badge, CodeBlock } from "@/app/lib/ui";
import { ReferenceLinks } from "./ReferenceLinks";
import { CopilotAnswer } from "@/app/lib/types";
import { parseJsonString, stringifyData } from "@/app/lib/utils";

export function ResponseDetails({ answer }: { answer: CopilotAnswer }) {
    if (!answer) return null;

    const hasDetails =
        answer.evidence?.length ||
        answer.missing?.length ||
        answer.links?.length ||
        answer.references ||
        answer.actions?.length ||
        answer.data;

    if (!hasDetails) return null;

    return (
        <Accordion title="Details" defaultOpen={false}>
            <div className="space-y-4 text-sm">
                {/* Evidence */}
                {answer.evidence?.length ? (
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Evidence</p>
                        <div className="space-y-2">
                            {answer.evidence.map((item, idx) => {
                                const itemStr = typeof item === "string" ? item : stringifyData(item);
                                const parsed = parseJsonString(itemStr);
                                if (parsed) {
                                    return <CodeBlock key={idx} code={stringifyData(parsed)} language="json" />;
                                }
                                return (
                                    <div key={idx} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                        <p className="break-words text-xs text-slate-700">{itemStr}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {/* Missing Data */}
                {answer.missing?.length ? (
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Missing Data</p>
                        <div className="flex flex-wrap gap-1.5">
                            {answer.missing.map((item, idx) => (
                                <Badge key={idx} label={item} variant="warning" size="xs" />
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* External Links */}
                {answer.links?.length ? (
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">External Links</p>
                        <ul className="space-y-1">
                            {answer.links.map((link) => (
                                <li key={`${link.label}-${link.url}`}>
                                    <a
                                        href={link.url}
                                        className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition-all hover:border-[#55cfd0] hover:bg-[#f4fcfc] hover:text-[#0f5f66]"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <span className="truncate font-medium">{link.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {/* References */}
                <ReferenceLinks references={answer.references} />

                {/* Suggested Actions */}
                {answer.actions?.length ? (
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Suggested Actions</p>
                        <div className="space-y-2">
                            {answer.actions.map((action, idx) => (
                                <div key={`${action.type}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-slate-800">{action.label}</span>
                                        <Badge label={action.type} variant="info" size="xs" />
                                    </div>
                                    {action.payload ? (
                                        <div className="mt-2">
                                            <CodeBlock code={stringifyData(action.payload)} language="json" />
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Raw Data */}
                {answer.data ? (
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Raw Data</p>
                        <CodeBlock code={stringifyData(answer.data)} language="json" />
                    </div>
                ) : null}

                {/* Full Response */}
                <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Full Response</p>
                    <CodeBlock code={stringifyData(answer)} language="json" />
                </div>
            </div>
        </Accordion>
    );
}
