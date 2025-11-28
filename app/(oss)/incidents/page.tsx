"use client";

import { IncidentsPanel } from "@/app/components/IncidentsPanel";
import { AppShell } from "@/app/components/AppShell";

export default function IncidentsPage() {
  return (
    <AppShell
      title="Incidents"
      description="Track incidents, create new ones, and open detailed timelines."
    >
      <IncidentsPanel />
    </AppShell>
  );
}
