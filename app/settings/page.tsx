"use client";

import { AppShell } from "@/app/components/AppShell";
import { SettingsPanel } from "@/app/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      description="Tune the console connection, check health, and manage defaults."
    >
      <SettingsPanel />
    </AppShell>
  );
}
