'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAsyncState } from '@/app/lib/hooks';
import { queryRuns } from '@/app/lib/orchestration';
import { OrchestrationRun, RunQuery } from '@/app/lib/types';
import { RunFilters } from './RunFilters';
import { RunList } from './RunList';
import { Pagination } from './Pagination';
import { serializeScope } from '@/app/lib/scope';

interface RunBrowserProps {
  initialQuery?: Partial<RunQuery>;
}

export function RunBrowser({ initialQuery }: RunBrowserProps) {
  const [runs, setRuns] = useState<OrchestrationRun[]>([]);
  const [query, setQuery] = useState<Partial<RunQuery>>(initialQuery || {});
  const [currentPage, setCurrentPage] = useState(0);
  const runState = useAsyncState();
  const { start, succeed, fail } = runState;
  const router = useRouter();
  const pathname = usePathname();
  const pageSize = 10;

  // Load runs when query changes
  useEffect(() => {
    const loadRuns = async () => {
      start();
      try {
        const runsData = await queryRuns(query);
        setRuns(runsData);
        succeed();
      } catch (error) {
        fail(error);
        setRuns([]);
      }
    };

    loadRuns();
  }, [query, start, succeed, fail]);

  const handleQueryChange = (newQuery: Partial<RunQuery>) => {
    setQuery(newQuery);
    setCurrentPage(0);

    const params = new URLSearchParams();
    if (newQuery.statuses && newQuery.statuses.length > 0) {
      params.set('status', newQuery.statuses.join(','));
    }
    if (newQuery.planIds && newQuery.planIds.length > 0) {
      params.set('planId', newQuery.planIds.join(','));
    }
    if (newQuery.limit) {
      params.set('limit', String(newQuery.limit));
    }
    const serializedScope = serializeScope(newQuery.scope);
    if (serializedScope) {
      params.set('scope', serializedScope);
    }

    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
  };

  const handleRunClick = (runId: string) => {
    window.location.href = `/orchestration/runs/${runId}`;
  };

  const pagedRuns = runs.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <RunFilters
        query={query}
        onQueryChange={handleQueryChange}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Workflow Runs
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {runState.loading ? 'Loading runs...' : `${runs.length} run${runs.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white shadow rounded-lg">
        <RunList
          runs={pagedRuns}
          loading={runState.loading}
          error={runState.error}
          onRunClick={handleRunClick}
        />
        <Pagination
          currentPage={currentPage}
          totalItems={runs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
