"use client";

import { ReactNode } from "react";
import { AppShell } from "@/app/components/AppShell";

interface OrchestrationLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function OrchestrationLayout({
  title,
  description,
  children,
}: OrchestrationLayoutProps) {
  return (
    <AppShell
      title={title}
      description={description}
    >
      {children}
    </AppShell>
  );
}