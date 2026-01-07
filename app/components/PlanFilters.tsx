"use client";

import { useState } from "react";
import { PlanQuery } from "@/app/lib/types";

interface PlanFiltersProps {
  onFilterChange: (filters: Partial<PlanQuery>) => void;
  loading?: boolean;
}

export function PlanFilters({ onFilterChange, loading }: PlanFiltersProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [service, setService] = useState("");
  const [team, setTeam] = useState("");
  const [environment, setEnvironment] = useState("");

  const handleSearch = () => {
    const filters: Partial<PlanQuery> = {
      query: query || undefined,
      tags: selectedType ? { type: selectedType } : undefined,
      scope: (service || team || environment) ? {
        service: service || undefined,
        team: team || undefined,
        environment: environment || undefined,
      } : undefined,
    };

    onFilterChange(filters);
  };

  const handleReset = () => {
    setQuery("");
    setSelectedType("");
    setService("");
    setTeam("");
    setEnvironment("");
    onFilterChange({});
  };

  const planTypes = [
    { value: "", label: "All Types" },
    { value: "playbook", label: "Playbooks" },
    { value: "runbook", label: "Runbooks" },
    { value: "release-checklist", label: "Release Checklists" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Search Plans</h3>
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

      <div className="space-y-4">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plan title or description..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-[#55cfd0] focus:outline-none focus:ring-1 focus:ring-[#55cfd0]"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Plan Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#55cfd0] focus:outline-none focus:ring-1 focus:ring-[#55cfd0]"
            >
              {planTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 rounded-lg bg-[#55cfd0] px-4 py-2 text-sm font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
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
                  value={service}
                  onChange={(e) => setService(e.target.value)}
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
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
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
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  placeholder="Filter by environment..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-[#55cfd0] focus:outline-none focus:ring-1 focus:ring-[#55cfd0]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}