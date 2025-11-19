"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { MetricsPanel } from "@/app/components/MetricsPanel";
import { MetricReference } from "@/app/lib/types";

const computeReference = (params: URLSearchParams): MetricReference | undefined => {
  const expression = params.get("expression") || undefined;
  const start = params.get("start") || undefined;
  const end = params.get("end") || undefined;
  const step = params.get("step") || undefined;
  const scope = params.get("scope") || undefined;
  if (!expression && !start && !end && !step && !scope) return undefined;
  return { expression: expression || "up", start, end, step, scope };
};

export default function MetricsPage() {
  const searchParams = useSearchParams();
  const reference = useMemo(() => computeReference(searchParams), [searchParams]);
  const key = searchParams.toString() || "metrics-root";

  return (
    <AppShell
      title="Metrics"
      description="Run time-series expressions and inspect stats quickly."
    >
      <MetricsPanel key={key} initialReference={reference} autoRun={Boolean(reference)} />
    </AppShell>
  );
}
