import React, { useState } from "react";
import { CodeBlock } from "@/app/lib/ui";

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
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="rounded-lg border border-slate-200 bg-white">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
                type="button"
            >
                <span className="text-sm font-semibold text-slate-900">{title}</span>
                <svg
                    className={`h-5 w-5 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="animate-slide-down border-t border-slate-200 p-4">
                    <CodeBlock code={code} language={language} />
                </div>
            )}
        </div>
    );
}
