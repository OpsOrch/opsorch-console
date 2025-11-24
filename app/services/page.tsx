"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ServicesPanel } from "@/app/components/ServicesPanel";
import { AppShell } from "@/app/components/AppShell";

function ServicesContent() {
  const searchParams = useSearchParams();
  const initialName = searchParams.get("name") || undefined;

  return <ServicesPanel initialName={initialName} />;
}

export default function ServicesPage() {
  return (
    <AppShell
      title="Services"
      description="Search for services and drill into their incidents and telemetry."
    >
      <Suspense fallback={<div>Loading...</div>}>
        <ServicesContent />
      </Suspense>
    </AppShell>
  );
}
