'use client';

import React from 'react';
import { OrchestrationLayout } from '@/app/components/OrchestrationLayout';
import { PlanBrowser } from '@/app/components/PlanBrowser';

export default function PlansPage() {
  return (
    <OrchestrationLayout 
      title="Workflow Plans"
      description="Browse and manage orchestration workflow plans"
    >
      <PlanBrowser />
    </OrchestrationLayout>
  );
}