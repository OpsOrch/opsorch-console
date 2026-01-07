"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAsyncState } from "@/app/lib/hooks";
import { queryPlans } from "@/app/lib/orchestration";
import { OrchestrationPlan } from "@/app/lib/types";

export function RecentPlans() {
  const [plans, setPlans] = useState<OrchestrationPlan[]>([]);
  const asyncState = useAsyncState();
  const { start, succeed, fail } = asyncState;

  useEffect(() => {
    const loadPlans = async () => {
      start();
      try {
        const result = await queryPlans({ limit: 5 }); // Get recent plans
        setPlans(result || []);
        succeed();
      } catch (err) {
        fail(err);
      }
    };

    loadPlans();
  }, [start, succeed, fail]);

  if (asyncState.loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Plans</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (asyncState.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Recent Plans</h3>
        <p className="text-sm text-red-600">Failed to load recent plans</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Plans</h3>
        <div className="text-center py-8">
          <div className="text-slate-400 mb-2">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-slate-600 mb-3">No plans available</p>
          <Link
            href="/orchestration/plans"
            className="text-sm text-[#55cfd0] hover:text-[#3d8f92] font-medium"
          >
            Browse Plans →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Recent Plans</h3>
        <Link
          href="/orchestration/plans"
          className="text-sm text-[#55cfd0] hover:text-[#3d8f92] font-medium"
        >
          View All →
        </Link>
      </div>
      <div className="space-y-3">
        {plans.map((plan) => (
          <Link
            key={plan.id}
            href={`/orchestration/plans/${plan.id}`}
            className="block p-3 rounded-lg border border-slate-100 hover:border-[#55cfd0] hover:bg-slate-50 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-900 truncate">
                  {plan.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {plan.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">
                    {plan.steps.length} steps
                  </span>
                  {plan.tags.type && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {plan.tags.type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}