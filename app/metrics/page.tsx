"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { MetricsPanel } from "@/app/components/MetricsPanel";
import { MetricReference } from "@/app/lib/types";
import { parseScope } from "@/app/lib/scope";

const computeReference = (params: URLSearchParams): MetricReference | undefined => {
  const expression = params.get("expression") || undefined;
  const start = params.get("start") || undefined;
  const end = params.get("end") || undefined;
  const step = params.get("step") || undefined;
  const scopeStr = params.get("scope");
  const scope = parseScope(scopeStr);
  if (!expression && !start && !end && !step && !scope) return undefined;
  return { expression: expression || "up", start, end, step: step ? Number(step) : undefined, scope };
};

import { Suspense } from "react";

function MetricsContent() {
  const searchParams = useSearchParams();
  const reference = useMemo(() => computeReference(searchParams), [searchParams]);
  const key = searchParams.toString() || "metrics-root";

  return <MetricsPanel key={key} initialReference={reference} autoRun={Boolean(reference)} />;
}

export default function MetricsPage() {
  return (
    <AppShell
      title="Metrics"
      description="Run time-series expressions and inspect stats quickly."
    >
      <Suspense fallback={<div>Loading...</div>}>
        <MetricsContent />
      </Suspense>
    </AppShell>
  );
}
