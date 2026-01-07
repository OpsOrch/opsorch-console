"use client";

import Image from "next/image";
import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";
import { isEnterprise } from "@/app/lib/edition";
import { EnterpriseOnly } from "@/app/components/EnterpriseOnly";

// Dynamic import for enterprise features
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let CopilotPanel: any = null;
if (isEnterprise()) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  CopilotPanel = require("@/app/components/(enterprise)/CopilotPanel").CopilotPanel;
}

export default function Home() {
  const hero = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <Image src="/OpsOrch.png" alt="OpsOrch" width={52} height={52} priority />
        <span>Unified Ops Console</span>
      </div>
    ),
    [],
  );

  // Enterprise edition: Show Copilot
  if (isEnterprise()) {
    return (
      <AppShell
        title="OpsOrch Copilot"
        hero={hero}
      >
        <div className="grid grid-cols-1 gap-6">
          {CopilotPanel ? (
            <CopilotPanel />
          ) : (
            <EnterpriseOnly featureName="Copilot" />
          )}
        </div>
      </AppShell>
    );
  }

  // OSS edition: Show welcome page with quick links
  return (
    <AppShell
      title="OpsOrch Console"
      description="Unified console for operational data"
      hero={hero}
    >
      <div className="grid grid-cols-1 gap-6">
        {/* Welcome Section */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Welcome to OpsOrch</h2>
          <p className="text-sm text-slate-600 mb-4">
            Access and manage your operational data from a single unified interface.
            Navigate through alerts, deployments, incidents, logs, metrics, orchestration, services, teams, and tickets to monitor and maintain your systems.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/alerts"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Alerts</h3>
            </div>
            <p className="text-sm text-slate-600">Manage system alerts and notifications</p>
          </Link>

          <Link
            href="/deployments"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Deployments</h3>
            </div>
            <p className="text-sm text-slate-600">Track and manage deployments</p>
          </Link>

          <Link
            href="/orchestration"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Orchestration</h3>
            </div>
            <p className="text-sm text-slate-600">Manage workflows and automation</p>
          </Link>

          <Link
            href="/teams"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Teams</h3>
            </div>
            <p className="text-sm text-slate-600">Manage teams and members</p>
          </Link>

          <Link
            href="/incidents"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Incidents</h3>
            </div>
            <p className="text-sm text-slate-600">View and manage active incidents</p>
          </Link>

          <Link
            href="/logs"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Logs</h3>
            </div>
            <p className="text-sm text-slate-600">Search and analyze system logs</p>
          </Link>

          <Link
            href="/metrics"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Metrics</h3>
            </div>
            <p className="text-sm text-slate-600">Monitor system performance metrics</p>
          </Link>

          <Link
            href="/tickets"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Tickets</h3>
            </div>
            <p className="text-sm text-slate-600">Track and manage support tickets</p>
          </Link>

          <Link
            href="/services"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Services</h3>
            </div>
            <p className="text-sm text-slate-600">View service status and health</p>
          </Link>

          <Link
            href="/settings"
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#55cfd0] hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-[#55cfd0]">Settings</h3>
            </div>
            <p className="text-sm text-slate-600">Configure console preferences</p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
