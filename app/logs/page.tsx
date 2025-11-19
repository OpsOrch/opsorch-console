"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { LogsPanel } from "@/app/components/LogsPanel";
import { LogReference } from "@/app/lib/types";

const computeReference = (params: URLSearchParams): LogReference | undefined => {
  const query = params.get("query") || undefined;
  const start = params.get("start") || undefined;
  const end = params.get("end") || undefined;
  const service = params.get("service") || undefined;
  const scope = params.get("scope") || undefined;
  if (!query && !start && !end && !service && !scope) return undefined;
  return { query: query || "", start, end, service, scope };
};

export default function LogsPage() {
  const searchParams = useSearchParams();
  const reference = useMemo(() => computeReference(searchParams), [searchParams]);
  const key = searchParams.toString() || "logs-root";

  return (
    <AppShell
      title="Logs"
      description="Run log searches over the connected source."
    >
      <LogsPanel key={key} initialReference={reference} autoRun={Boolean(reference)} />
    </AppShell>
  );
}
