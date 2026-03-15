"use client";

import { OrchestrationLayout } from "@/app/components/OrchestrationLayout";
import { OrchestrationHome } from "@/app/components/OrchestrationHome";

export default function OrchestrationsPage() {
  return (
    <OrchestrationLayout
      title="Orchestrations"
      description="Manage operational workflows and automation"
    >
      <OrchestrationHome />
    </OrchestrationLayout>
  );
}