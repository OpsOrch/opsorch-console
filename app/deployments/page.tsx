"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { DeploymentsPanel } from "@/app/components/DeploymentsPanel";
import { parseScope } from "@/app/lib/scope";

function DeploymentsContent() {
  const params = useSearchParams();
  const deploymentId = params.get("deploymentId") || undefined;
  const scope = parseScope(params.get("scope"));
  const query = params.get("query") || undefined;
  const statuses = params.get("statuses")?.split(",").filter(Boolean) || undefined;
  const versions = params.get("versions")?.split(",").filter(Boolean) || undefined;
  
  const initialQuery = useMemo(() => ({
    query,
    statuses,
    versions,
    scope,
  }), [query, statuses, versions, scope]);
  
  const key = deploymentId ? `deployment-${deploymentId}` : `deployments-${params.toString()}`;

  return <DeploymentsPanel key={key} initialDeploymentId={deploymentId} initialScope={scope} initialQuery={initialQuery} autoRun={Boolean(query || statuses || versions || scope)} />;
}

export default function DeploymentsPage() {
  return (
    <AppShell
      title="Deployments"
      description="Search and track deployments across your services and environments."
    >
      <Suspense fallback={<div>Loading...</div>}>
        <DeploymentsContent />
      </Suspense>
    </AppShell>
  );
}