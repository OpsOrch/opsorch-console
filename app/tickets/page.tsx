"use client";

import { AppShell } from "@/app/components/AppShell";
import { TicketsPanel } from "@/app/components/TicketsPanel";

export default function TicketsPage() {
  return (
    <AppShell
      title="Tickets"
      description="Create tickets, query by scope, and open detailed ticket views."
    >
      <TicketsPanel />
    </AppShell>
  );
}
