"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAsyncState } from "@/app/lib/hooks";
import { queryPlans } from "@/app/lib/orchestration";
import { OrchestrationPlan, PlanQuery, QueryScope } from "@/app/lib/types";
import { PlanGrid } from "@/app/components/PlanGrid";
import { PlanFilters } from "@/app/components/PlanFilters";

export function PlanBrowser() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<OrchestrationPlan[]>([]);
  const [currentFilters, setCurrentFilters] = useState<Partial<PlanQuery>>({});
  const [initialFilters, setInitialFilters] = useState<Partial<PlanQuery> | null>(null);
  const asyncState = useAsyncState();
  const { start, succeed, fail } = asyncState;

  // Parse URL params on mount
  useEffect(() => {
    const scopeParam = searchParams.get("scope");
    const queryParam = searchParams.get("query");

    const filters: Partial<PlanQuery> = {};

    if (scopeParam) {
      try {
        filters.scope = JSON.parse(scopeParam) as QueryScope;
      } catch {
        // Invalid JSON, ignore
      }
    }

    if (queryParam) {
      filters.query = queryParam;
    }

    // Use an async function and microtask to set state to avoid direct setState in effect
    Promise.resolve().then(() => {
      setInitialFilters(filters);
      setCurrentFilters(filters);
    });
  }, [searchParams]);

  const loadPlans = useCallback(
    async (filters: Partial<PlanQuery> = {}) => {
      start();
      try {
        const result = await queryPlans({
          ...filters,
          limit: 50, // Load up to 50 plans
        });
        setPlans(result || []);
        succeed();
      } catch (err) {
        fail(err);
      }
    },
    [start, succeed, fail],
  );

  const handleFilterChange = (filters: Partial<PlanQuery>) => {
    setCurrentFilters(filters);
    loadPlans(filters);
  };

  // Load plans once initial filters are parsed
  useEffect(() => {
    if (initialFilters !== null) {
      const timeoutId = setTimeout(() => {
        void loadPlans(initialFilters);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [initialFilters, loadPlans]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <PlanFilters
        key={JSON.stringify(initialFilters)}
        onFilterChange={handleFilterChange}
        loading={asyncState.loading}
        initialFilters={initialFilters || undefined}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Available Plans
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {asyncState.loading ? (
              "Loading plans..."
            ) : (
              `${plans.length} plan${plans.length !== 1 ? 's' : ''} found`
            )}
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Sort by:</label>
          <select className="rounded-lg border border-slate-300 px-3 py-1 text-sm focus:border-[#55cfd0] focus:outline-none focus:ring-1 focus:ring-[#55cfd0]">
            <option value="title">Title</option>
            <option value="type">Type</option>
            <option value="steps">Step Count</option>
          </select>
        </div>
      </div>

      {/* Plan Grid */}
      <PlanGrid
        plans={plans}
        loading={asyncState.loading}
        error={asyncState.error}
      />

      {/* Load More Button (if needed) */}
      {plans.length >= 50 && !asyncState.loading && (
        <div className="text-center pt-6">
          <button
            onClick={() => loadPlans({ ...currentFilters, limit: plans.length + 50 })}
            className="inline-flex items-center px-6 py-3 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            Load More Plans
          </button>
        </div>
      )}
    </div>
  );
}
