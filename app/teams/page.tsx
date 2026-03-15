"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TeamsPanel } from "@/app/components/TeamsPanel";
import { AppShell } from "@/app/components/AppShell";

function TeamsContent() {
  const searchParams = useSearchParams();
  const initialName = searchParams.get("name") || undefined;

  return <TeamsPanel initialName={initialName} />;
}

export default function TeamsPage() {
  return (
    <AppShell
      title="Teams"
      description="Search for teams and explore their members, services, and organizational structure."
    >
      <Suspense fallback={<div>Loading...</div>}>
        <TeamsContent />
      </Suspense>
    </AppShell>
  );
}