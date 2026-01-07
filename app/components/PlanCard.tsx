"use client";

import Link from "next/link";
import { OrchestrationPlan } from "@/app/lib/types";

interface PlanCardProps {
  plan: OrchestrationPlan;
}

export function PlanCard({ plan }: PlanCardProps) {
  // Get step type counts for display
  const stepTypeCounts = plan.steps.reduce((acc, step) => {
    acc[step.type] = (acc[step.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get plan type from tags for styling
  const planType = plan.tags.type || 'workflow';
  
  // Color scheme based on plan type
  const typeColors = {
    playbook: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
    runbook: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
    'release-checklist': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    workflow: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-800' },
  };
  
  const colors = typeColors[planType as keyof typeof typeColors] || typeColors.workflow;

  return (
    <Link
      href={`/orchestration/plans/${plan.id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-6 transition hover:border-[#55cfd0] hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-[#55cfd0] truncate">
            {plan.title}
          </h3>
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
            {plan.description}
          </p>
        </div>
      </div>

      {/* Step Count and Type Breakdown */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}>
            <svg className={`h-4 w-4 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-700">
            {plan.steps.length} step{plan.steps.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Manual steps indicator */}
        {stepTypeCounts.manual > 0 && (
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs text-amber-700 font-medium">
              {stepTypeCounts.manual} manual
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {plan.tags.type && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
            {plan.tags.type}
          </span>
        )}
        {Object.entries(plan.tags)
          .filter(([key]) => key !== 'type')
          .slice(0, 3)
          .map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
            >
              {key}: {value}
            </span>
          ))}
        {Object.keys(plan.tags).length > 4 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
            +{Object.keys(plan.tags).length - 4} more
          </span>
        )}
      </div>

      {/* Step Type Summary */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {Object.entries(stepTypeCounts).map(([type, count]) => (
          <span key={type} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              type === 'manual' ? 'bg-amber-400' :
              type === 'observe' ? 'bg-blue-400' :
              type === 'invoke' ? 'bg-green-400' :
              type === 'verify' ? 'bg-purple-400' :
              'bg-slate-400'
            }`} />
            {count} {type}
          </span>
        ))}
      </div>

      {/* Version info if available */}
      {plan.version && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">Version: {plan.version}</span>
        </div>
      )}
    </Link>
  );
}
