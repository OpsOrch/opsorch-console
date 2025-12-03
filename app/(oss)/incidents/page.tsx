"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IncidentsPanel } from "@/app/components/IncidentsPanel";
import { AppShell } from "@/app/components/AppShell";
import { decodeIncidentQuery } from "@/app/lib/utils";

function IncidentsContent() {
  const searchParams = useSearchParams();
  const incidentQuery = decodeIncidentQuery(searchParams);
  return <IncidentsPanel initialQuery={incidentQuery} />;
}

export default function IncidentsPage() {
  return (
    <AppShell
      title="Incidents"
      description="Track incidents, create new ones, and open detailed timelines."
    >
      <Suspense fallback={<IncidentsPanel />}>
        <IncidentsContent />
      </Suspense>
    </AppShell>
  );
}
