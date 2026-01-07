'use client';

import React, { useState } from 'react';
import { queryPlans } from '@/app/lib/orchestration';
import { RunQuery, RunStatus, QueryScope } from '@/app/lib/types';

interface RunFiltersProps {
  query: Partial<RunQuery>;
  onQueryChange: (query: Partial<RunQuery>) => void;
}

const RUN_STATUSES: RunStatus[] = ['created', 'running', 'blocked', 'completed', 'failed', 'cancelled'];

export function RunFilters({ query, onQueryChange }: RunFiltersProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<RunStatus[]>(query.statuses || []);
  const [planIds, setPlanIds] = useState<string[]>(query.planIds || []);
  const [planSearch, setPlanSearch] = useState('');
  const [scope, setScope] = useState<QueryScope>(query.scope || {});
  const [showAdvanced, setShowAdvanced] = useState(Boolean(query.scope));

  const handleSearch = async () => {
    let resolvedPlanIds = planIds;
    if (planSearch.trim()) {
      try {
        const matches = await queryPlans({ query: planSearch.trim(), limit: 10 });
        resolvedPlanIds = matches.map(plan => plan.id);
      } catch {
        resolvedPlanIds = [];
      }
    }

    if (resolvedPlanIds !== planIds) {
      setPlanIds(resolvedPlanIds);
    }

    const newQuery: Partial<RunQuery> = {
      ...query,
      statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      planIds: resolvedPlanIds.length > 0 ? resolvedPlanIds : undefined,
      scope: Object.keys(scope).length > 0 ? scope : undefined,
    };
    onQueryChange(newQuery);
  };

  const handlePlanIdRemove = (planId: string) => {
    setPlanIds(planIds.filter(id => id !== planId));
  };

  const handleScopeChange = (field: keyof QueryScope, value: string) => {
    setScope({
      ...scope,
      [field]: value || undefined,
    });
  };

  const handleClear = () => {
    setSelectedStatuses([]);
    setPlanIds([]);
    setPlanSearch('');
    setScope({});
    onQueryChange({});
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Search Runs</h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {showAdvanced ? "Hide" : "Show"} Advanced
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <select
            value={selectedStatuses[0] || ''}
            onChange={(e) => setSelectedStatuses(e.target.value ? [e.target.value as RunStatus] : [])}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#55cfd0] focus:outline-none focus:ring-1 focus:ring-[#55cfd0]"
          >
            <option value="">All statuses</option>
            {RUN_STATUSES.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Plan
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by plan name..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-[#55cfd0] focus:outline-none focus:ring-1 focus:ring-[#55cfd0]"
            />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => void handleSearch()}
            className="flex-1 rounded-lg bg-[#55cfd0] px-4 py-2 text-sm font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
          >
            Search
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      {planIds.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500 font-medium">Filtered plans:</span>
          {planIds.map(planId => (
            <span
              key={planId}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800"
            >
              {planId}
              <button
                onClick={() => handlePlanIdRemove(planId)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {showAdvanced && (
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Scope Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Service
              </label>
              <input
                type="text"
                value={scope.service || ''}
                onChange={(e) => handleScopeChange('service', e.target.value)}
                placeholder="Filter by service..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-[#55cfd0] focus:outline-none focus:ring-1 focus:ring-[#55cfd0]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Team
              </label>
              <input
                type="text"
                value={scope.team || ''}
                onChange={(e) => handleScopeChange('team', e.target.value)}
                placeholder="Filter by team..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-[#55cfd0] focus:outline-none focus:ring-1 focus:ring-[#55cfd0]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Environment
              </label>
              <input
                type="text"
                value={scope.environment || ''}
                onChange={(e) => handleScopeChange('environment', e.target.value)}
                placeholder="Filter by environment..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-[#55cfd0] focus:outline-none focus:ring-1 focus:ring-[#55cfd0]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
