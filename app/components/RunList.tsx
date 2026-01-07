'use client';

import React from 'react';
import { OrchestrationRun } from '@/app/lib/types';
import { RunItem } from './RunItem';

interface RunListProps {
  runs: OrchestrationRun[];
  loading: boolean;
  error: string;
  onRunClick: (runId: string) => void;
}

export function RunList({ runs, loading, error, onRunClick }: RunListProps) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="mt-2 text-gray-600">Loading runs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Error loading runs</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div className="text-lg font-medium text-gray-900 mb-1">No runs found</div>
          <div className="text-gray-600">Try adjusting your filters or check back later for new runs.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {runs.map(run => (
        <RunItem
          key={run.id}
          run={run}
          onClick={() => onRunClick(run.id)}
        />
      ))}
    </div>
  );
}