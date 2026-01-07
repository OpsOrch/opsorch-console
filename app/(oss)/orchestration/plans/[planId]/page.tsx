'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { OrchestrationLayout } from '@/app/components/OrchestrationLayout';
import { PlanDetail } from '@/app/components/PlanDetail';

export default function PlanDetailPage() {
  const params = useParams();
  const planId = params.planId as string;

  return (
    <OrchestrationLayout title="Plan Details">
      <PlanDetail planId={planId} />
    </OrchestrationLayout>
  );
}