"use client";

import React, { useState } from "react";

function parseNarrative(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const bulletLines = lines.filter((line) => line.startsWith("- "));
  const summaryLines = lines.filter((line) => line && !line.startsWith("- "));
  const summary = summaryLines.join(" ");

  if (bulletLines.length === 0) {
    return { summary, bullets: [] as string[] };
  }

  const bullets = bulletLines.map((line) => line.replace(/^- /, ""));

  return { summary, bullets };
}

export function CopilotConclusion({ text }: { text: string }) {
  const { summary, bullets } = parseNarrative(text);
  const [isExpanded, setIsExpanded] = useState(false);

  if (bullets.length === 0) {
    return <p className="whitespace-pre-line text-sm leading-relaxed text-slate-900">{text}</p>;
  }

  return (
    <div className="space-y-3">
      {summary && (
        <p className="text-sm leading-relaxed text-slate-900">{summary}</p>
      )}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Key Points ({bullets.length})
          </p>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <ul className="space-y-2">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-slate-800">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                <span className="leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
