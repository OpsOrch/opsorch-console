'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrchestrationLayout } from '@/app/components/OrchestrationLayout';
import { RunBrowser } from '@/app/components/RunBrowser';
import { RunQuery, RunStatus } from '@/app/lib/types';
import { parseScope } from '@/app/lib/scope';

function RunsPageContent() {
  const searchParams = useSearchParams();
  
  // Parse initial query from URL parameters
  const initialQuery: Partial<RunQuery> = {};
  
  const statusParam = searchParams.get('status') || searchParams.get('statuses');
  if (statusParam) {
    const statuses = statusParam.split(',') as RunStatus[];
    initialQuery.statuses = statuses;
  }
  
  const planIdParam = searchParams.get('planId') || searchParams.get('planIds');
  if (planIdParam) {
    initialQuery.planIds = planIdParam.split(',').filter(Boolean);
  }

  const limitParam = searchParams.get('limit');
  if (limitParam) {
    const limit = Number(limitParam);
    if (!Number.isNaN(limit) && limit > 0) {
      initialQuery.limit = limit;
    }
  }

  const scopeParam = searchParams.get('scope');
  const parsedScope = parseScope(scopeParam);
  const service = searchParams.get('service');
  const environment = searchParams.get('environment');
  const team = searchParams.get('team');
  
  if (parsedScope) {
    initialQuery.scope = parsedScope;
  } else if (service || environment || team) {
    initialQuery.scope = {
      service: service || undefined,
      environment: environment || undefined,
      team: team || undefined,
    };
  }

  return <RunBrowser initialQuery={initialQuery} />;
}

export default function RunsPage() {
  return (
    <OrchestrationLayout 
      title="Workflow Runs"
      description="Browse and monitor orchestration workflow runs"
    >
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
        <RunsPageContent />
      </Suspense>
    </OrchestrationLayout>
  );
}
