'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { OrchestrationLayout } from '@/app/components/OrchestrationLayout';
import { PlanDetail } from '@/app/components/PlanDetail';

export default function PlanDetailPage() {
  const params = useParams();
  const planId = params.planId as string;

  return (
    <OrchestrationLayout title="Plan Details">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
        <PlanDetail planId={planId} />
      </Suspense>
    </OrchestrationLayout>
  );
}