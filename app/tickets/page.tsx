"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { TicketsPanel } from "@/app/components/TicketsPanel";

export default function TicketsPage() {
  const params = useSearchParams();
  const ticketId = useMemo(() => params.get("ticketId") || undefined, [params]);
  const key = ticketId ? `ticket-${ticketId}` : "tickets-root";

  return (
    <AppShell
      title="Tickets"
      description="Create tickets, query by scope, and open detailed ticket views."
    >
      <TicketsPanel key={key} initialTicketId={ticketId} />
    </AppShell>
  );
}
