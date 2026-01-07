'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { OrchestrationLayout } from '@/app/components/OrchestrationLayout';
import { RunDetail } from '@/app/components/RunDetail';

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.runId as string;

  return (
    <OrchestrationLayout title="Run Details">
      <RunDetail runId={runId} />
    </OrchestrationLayout>
  );
}