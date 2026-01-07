"use client";

import Link from "next/link";

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link
        href="/orchestration/plans"
        className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Browse Plans</h3>
        </div>
        <p className="text-sm text-slate-600">Discover available operational workflows</p>
      </Link>

      <Link
        href="/orchestration/runs"
        className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Active Runs</h3>
        </div>
        <p className="text-sm text-slate-600">Monitor running workflows and complete manual steps</p>
      </Link>
    </div>
  );
}