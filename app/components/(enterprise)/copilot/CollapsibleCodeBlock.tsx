import React, { useState } from "react";
import { CodeBlock } from "@/app/lib/ui";
import { trace } from "next/dist/trace";

export function CollapsibleCodeBlock({
    code,
    language = "json",
    defaultOpen = false,
    title = "View Code",
}: {
    code: string;
    language?: string;
    defaultOpen?: boolean;
    title?: string;
}) {
    const [isExpanded, setIsExpanded] = useState(defaultOpen);

    return (
         <div className="space-y-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between text-left"
            >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {title}
                </p>
                <div className="flex items-center gap-2">
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
                <div className="animate-slide-down border-t border-slate-200 p-4">
                    <CodeBlock code={code} language={language} />
                </div>
            )}
        </div>
    );
}
