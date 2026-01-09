'use client';

import { OrchestrationLayout } from '@/app/components/OrchestrationLayout';
import { PlanBrowser } from '@/app/components/PlanBrowser';
import { Suspense } from 'react';

export default function PlansPage() {
  return (
    <OrchestrationLayout
      title="Workflow Plans"
      description="Browse and manage orchestration workflow plans"
    >
      <Suspense fallback={<div>Loading plans...</div>}>
        <PlanBrowser />
      </Suspense>
    </OrchestrationLayout>
  );
}
