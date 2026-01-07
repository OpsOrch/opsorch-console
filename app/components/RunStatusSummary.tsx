"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAsyncState } from "@/app/lib/hooks";
import { queryRuns } from "@/app/lib/orchestration";
import { OrchestrationRun, RunStatus } from "@/app/lib/types";

interface StatusCount {
  status: RunStatus;
  count: number;
  label: string;
  color: string;
}

export function RunStatusSummary() {
  const [runs, setRuns] = useState<OrchestrationRun[]>([]);
  const asyncState = useAsyncState();
  const { start, succeed, fail } = asyncState;

  useEffect(() => {
    const loadRuns = async () => {
      start();
      try {
        const result = await queryRuns({ limit: 1000 }); // Get all runs for summary
        setRuns(result || []);
        succeed();
      } catch (err) {
        fail(err);
      }
    };

    loadRuns();
  }, [start, succeed, fail]);

  if (asyncState.loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Run Status Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="h-8 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (asyncState.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Run Status Summary</h3>
        <p className="text-sm text-red-600">Failed to load run status summary</p>
      </div>
    );
  }

  // Count runs by status
  const statusCounts: StatusCount[] = [
    {
      status: 'running',
      count: runs.filter(run => run.status === 'running').length,
      label: 'Running',
      color: 'text-green-600'
    },
    {
      status: 'blocked',
      count: runs.filter(run => run.status === 'blocked').length,
      label: 'Blocked',
      color: 'text-amber-600'
    },
    {
      status: 'completed',
      count: runs.filter(run => run.status === 'completed').length,
      label: 'Completed',
      color: 'text-blue-600'
    },
    {
      status: 'failed',
      count: runs.filter(run => run.status === 'failed').length,
      label: 'Failed',
      color: 'text-red-600'
    }
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Run Status Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusCounts.map((statusCount) => {
          const isBlocked = statusCount.status === 'blocked';
          const isFailed = statusCount.status === 'failed';
          const hasIssues = isBlocked || isFailed;
          
          return (
            <div 
              key={statusCount.status} 
              className={`text-center p-3 rounded-lg transition ${
                hasIssues && statusCount.count > 0
                  ? isBlocked 
                    ? 'bg-amber-50 border border-amber-200 ring-2 ring-amber-100' 
                    : 'bg-red-50 border border-red-200 ring-2 ring-red-100'
                  : 'bg-slate-50'
              }`}
            >
              <div className={`text-2xl font-bold ${statusCount.color} ${
                hasIssues && statusCount.count > 0 ? 'animate-pulse' : ''
              }`}>
                {statusCount.count}
              </div>
              <div className="text-sm text-slate-600 font-medium">{statusCount.label}</div>
              {isBlocked && statusCount.count > 0 && (
                <div className="mt-1 text-xs text-amber-700 font-medium">
                  Needs Attention
                </div>
              )}
              {isFailed && statusCount.count > 0 && (
                <div className="mt-1 text-xs text-red-700 font-medium">
                  Action Required
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {(() => {
        const blockedCount = statusCounts?.find(s => s.status === 'blocked')?.count || 0;
        const runningCount = statusCounts?.find(s => s.status === 'running')?.count || 0;
        if (blockedCount === 0 && runningCount === 0) return null;

        return (
          <div className="mt-4 grid gap-3">
            {runningCount > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">
                    {runningCount} workflow{runningCount !== 1 ? 's' : ''} running right now
                  </span>
                </div>
                <Link
                  href="/orchestration/runs?status=running"
                  className="inline-block mt-2 text-sm text-green-700 hover:text-green-900 font-medium underline"
                >
                  View running runs →
                </Link>
              </div>
            )}

            {blockedCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-800">
                    {blockedCount} workflow{blockedCount !== 1 ? 's' : ''} blocked and waiting for manual action
                  </span>
                </div>
                <Link
                  href="/orchestration/runs?status=blocked"
                  className="inline-block mt-2 text-sm text-amber-700 hover:text-amber-900 font-medium underline"
                >
                  View blocked runs →
                </Link>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
