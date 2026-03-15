"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { LogsPanel } from "@/app/components/LogsPanel";
import { LogReference } from "@/app/lib/types";
import { parseScope } from "@/app/lib/scope";
import { decodeLogExpression } from "@/app/lib/utils";

const computeReference = (params: URLSearchParams): LogReference | undefined => {
  const expression = decodeLogExpression(params);
  const start = params.get("start") || undefined;
  const end = params.get("end") || undefined;
  const scopeStr = params.get("scope");
  const scope = parseScope(scopeStr);

  // Check if we have any meaningful data
  if (!expression.search && !expression.filters?.length && !expression.severityIn?.length && !start && !end && !scope) {
    return undefined;
  }

  return { expression, start, end, scope };
};

import { Suspense } from "react";

function LogsContent() {
  const searchParams = useSearchParams();
  const reference = useMemo(() => computeReference(searchParams), [searchParams]);
  const key = searchParams.toString() || "logs-root";

  return <LogsPanel key={key} initialReference={reference} autoRun={true} />;
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
