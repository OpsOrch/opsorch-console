import React from "react";
import { CopilotAction } from "@/app/lib/types";

export function ActionLinks({
    actions,
}: {
    actions?: CopilotAction[];
}) {
    if (!actions?.length) {
        return null;
    }

    return (
        <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Recommended Actions ({actions.length})
            </p>
            <div className="flex flex-col gap-2">
                {actions.map((action, idx) => {
                    const href = action.id
                        ? `/orchestration/plans/${action.id}`
                        : `/orchestration/plans`;
                    const label = action.name || action.id || "Run Orchestration";

                    return (
                        <a
                            key={`action-${idx}`}
                            href={href}
                            className="group flex items-start gap-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 transition-all hover:border-emerald-300 hover:from-emerald-100 hover:to-teal-100 hover:shadow-md"
                        >
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-emerald-800">{label}</span>
                                    <svg className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                {action.reason && (
                                    <p className="mt-1 text-xs text-emerald-600 leading-relaxed">
                                        {action.reason}
                                    </p>
                                )}
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
