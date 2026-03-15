"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { TicketsPanel } from "@/app/components/TicketsPanel";
import { parseScope } from "@/app/lib/scope";

import { Suspense } from "react";

function TicketsContent() {
  const params = useSearchParams();
  const ticketId = useMemo(() => params.get("ticketId") || undefined, [params]);
  const scope = useMemo(() => parseScope(params.get("scope")), [params]);
  const key = ticketId ? `ticket-${ticketId}` : "tickets-root";

  return <TicketsPanel key={key} initialTicketId={ticketId} initialScope={scope} />;
}

export default function TicketsPage() {
  return (
    <AppShell
      title="Tickets"
      description="Create tickets, query by scope, and open detailed ticket views."
    >
      <Suspense fallback={<div>Loading...</div>}>
        <TicketsContent />
      </Suspense>
    </AppShell>
  );
}
