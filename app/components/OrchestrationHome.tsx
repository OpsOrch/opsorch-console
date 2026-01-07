"use client";

import { RunStatusSummary } from "@/app/components/RunStatusSummary";
import { RecentPlans } from "@/app/components/RecentPlans";
import { QuickActions } from "@/app/components/QuickActions";

export function OrchestrationHome() {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Welcome Section */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Workflow Orchestration</h2>
        <p className="text-sm text-slate-600 mb-4">
          Automate your operations with runbooks, playbooks, and checklists. Streamline complex workflows and ensure consistency across your team.
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Status Summary and Recent Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RunStatusSummary />
        <RecentPlans />
      </div>
    </div>
  );
}
