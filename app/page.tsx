"use client";

import Image from "next/image";
import { useMemo } from "react";
import { AppShell } from "@/app/components/AppShell";
import { CopilotPanel } from "@/app/components/CopilotPanel";

export default function Home() {
  const hero = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <Image src="/OpsOrch.png" alt="OpsOrch" width={52} height={52} priority />
        <span>Unified Ops Console</span>
      </div>
    ),
    [],
  );

  return (
    <AppShell
      title="Overview"
      description="Wire incident, log, metric, ticket, and messaging flows into one place."
      hero={hero}
    >
      <div className="grid grid-cols-1 gap-6">
        <CopilotPanel />
      </div>
    </AppShell>
  );
}
