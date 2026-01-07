"use client";

import { OrchestrationPlan } from "@/app/lib/types";
import { PlanCard } from "@/app/components/PlanCard";

interface PlanGridProps {
  plans: OrchestrationPlan[];
  loading?: boolean;
  error?: string;
}

export function PlanGrid({ plans, loading, error }: PlanGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="h-6 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-slate-200 rounded-full w-16"></div>
              <div className="h-6 bg-slate-200 rounded-full w-20"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-3 bg-slate-200 rounded w-12"></div>
              <div className="h-3 bg-slate-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Plans</h3>
        <p className="text-sm text-slate-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#55cfd0] hover:bg-[#3fb8b8] transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Plans Found</h3>
        <p className="text-sm text-slate-600 mb-4">
          No orchestration plans match your current filters.
        </p>
        <p className="text-xs text-slate-500">
          Try adjusting your search criteria or check back later for new plans.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}