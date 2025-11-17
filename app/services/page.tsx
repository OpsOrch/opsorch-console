"use client";

import { ServicesPanel } from "@/app/components/ServicesPanel";
import { AppShell } from "@/app/components/AppShell";

export default function ServicesPage() {
  return (
    <AppShell
      title="Services"
      description="Search for services and drill into their incidents and telemetry."
    >
      <ServicesPanel />
    </AppShell>
  );
}
