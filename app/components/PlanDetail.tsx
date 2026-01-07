'use client';

import { useState, useEffect } from 'react';
import { useAsyncState } from '@/app/lib/hooks';
import { getPlan, startRun } from '@/app/lib/orchestration';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { MarkdownText } from './MarkdownText';
import { OrchestrationPlan } from '@/app/lib/types';

interface PlanDetailProps {
  planId: string;
}

export function PlanDetail({ planId }: PlanDetailProps) {
  const [plan, setPlan] = useState<OrchestrationPlan | null>(null);
  const planState = useAsyncState();
  const { start, succeed, fail } = planState;
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [startRunError, setStartRunError] = useState<string | null>(null);

  // Load plan data
  useEffect(() => {
    const loadPlan = async () => {
      start();
      try {
        const planData = await getPlan(planId);
        setPlan(planData);
        succeed();
      } catch (error) {
        fail(error);
      }
    };
    
    loadPlan();
  }, [planId, start, succeed, fail]);

  const handleStartRun = async () => {
    if (!plan) return;
    
    setIsStartingRun(true);
    setStartRunError(null);
    
    try {
      const run = await startRun(plan.id);
      // Navigate to the run detail page
      window.location.href = `/orchestration/runs/${run.id}`;
    } catch (error) {
      setStartRunError(error instanceof Error ? error.message : 'Failed to start run');
    } finally {
      setIsStartingRun(false);
    }
  };

  const handleStepClick = (stepId: string) => {
    console.log('Step clicked:', stepId);
    // TODO: Show step details in a modal or sidebar
  };

  if (planState.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading plan...</div>
      </div>
    );
  }

  if (planState.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800 font-medium">Error loading plan</div>
        <div className="text-red-600 text-sm mt-1">{planState.error}</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="text-yellow-800 font-medium">Plan not found</div>
        <div className="text-yellow-600 text-sm mt-1">
          The requested plan could not be found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {plan.title}
            </h1>
            
            {plan.description && (
              <p className="text-gray-600 mb-4">
                {plan.description}
              </p>
            )}
          </div>

          <div className="md:justify-self-end">
            <button
              onClick={handleStartRun}
              disabled={isStartingRun}
              className={
                isStartingRun
                  ? "rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                  : "rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
              }
            >
              {isStartingRun ? 'Starting...' : 'Start Run'}
            </button>
            
            {startRunError && (
              <div className="mt-2 text-red-600 text-sm">
                {startRunError}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-4 text-sm text-gray-500 md:col-span-2">
            <div>
              <span className="font-medium">Steps:</span> {plan.steps.length}
            </div>
            {plan.version && (
              <div>
                <span className="font-medium">Version:</span> {plan.version}
              </div>
            )}
            {Object.keys(plan.tags).length > 0 && (
              <div>
                <span className="font-medium">Tags:</span>{' '}
                {Object.entries(plan.tags).map(([key, value]) => (
                  <span key={key} className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-1">
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <a
                href={`/orchestration/runs?planId=${plan.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-[#8fdede] bg-white px-2 py-1 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:text-[#0b1517]"
              >
                View runs
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              {plan.url && (
                <a
                  href={plan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-[#8fdede] bg-white px-2 py-1 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:text-[#0b1517]"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in Tool
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Visualizer */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Workflow Steps
        </h2>
        
        <WorkflowVisualizer
          steps={plan.steps}
          onStepClick={handleStepClick}
          className="h-96"
        />
      </div>

      {/* Step Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Step Details
        </h2>
        
        <div className="space-y-3">
          {plan.steps.map((step) => (
            <div key={step.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-600">
                        {step.type.charAt(0).toUpperCase()}
                      </span>
                      {step.type}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  
                  {step.description && (
                    <p className="text-gray-600 text-sm mb-2">
                      <MarkdownText text={step.description} />
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-500 md:text-right">
                  <div className="font-medium text-gray-400 uppercase tracking-wide mb-1">
                    Step Id
                  </div>
                  <div className="font-mono text-[11px] text-gray-600">{step.id}</div>
                </div>
              </div>

              {step.dependsOn && step.dependsOn.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-400 uppercase tracking-wide">Depends on</span>
                  {step.dependsOn.map(dep => (
                    <span key={dep} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                      {dep}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
