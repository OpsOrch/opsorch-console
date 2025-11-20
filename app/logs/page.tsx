"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { LogsPanel } from "@/app/components/LogsPanel";
import { LogReference } from "@/app/lib/types";
import { mergeScopes, parseScope } from "@/app/lib/scope";

const computeReference = (params: URLSearchParams): LogReference | undefined => {
  const query = params.get("query") || undefined;
  const start = params.get("start") || undefined;
  const end = params.get("end") || undefined;
  const service = params.get("service") || undefined;
  const scopeStr = params.get("scope");
  let scope = parseScope(scopeStr);

  if (service) {
    scope = mergeScopes(scope, { service });
  }

  if (!query && !start && !end && !scope) return undefined;
  return { query: query || "", start, end, scope };
};

import { Suspense } from "react";

function LogsContent() {
  const searchParams = useSearchParams();
  const reference = useMemo(() => computeReference(searchParams), [searchParams]);
  const key = searchParams.toString() || "logs-root";

  return <LogsPanel key={key} initialReference={reference} autoRun={Boolean(reference)} />;
}

export default function LogsPage() {
  return (
    <AppShell
      title="Logs"
      description="Run log searches over the connected source."
    >
      <Suspense fallback={<div>Loading...</div>}>
        <LogsContent />
      </Suspense>
    </AppShell>
  );
}
