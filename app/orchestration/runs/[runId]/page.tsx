'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { OrchestrationLayout } from '@/app/components/OrchestrationLayout';
import { RunDetail } from '@/app/components/RunDetail';

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.runId as string;

  return (
    <OrchestrationLayout title="Run Details">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
        <RunDetail runId={runId} />
      </Suspense>
    </OrchestrationLayout>
  );
}
