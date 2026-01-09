'use client';

import { useState, useEffect } from 'react';
import { useAsyncState } from '@/app/lib/hooks';
import { getRun, getPlan } from '@/app/lib/orchestration';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { MarkdownText } from './MarkdownText';
import { StepCompletionModal } from './StepCompletionModal';
import { OrchestrationRun, OrchestrationPlan, OrchestrationStepState } from '@/app/lib/types';
import { formatDate } from '@/app/lib/utils';

interface RunDetailProps {
  runId: string;
}

export function RunDetail({ runId }: RunDetailProps) {
  const [run, setRun] = useState<OrchestrationRun | null>(null);
  const [plan, setPlan] = useState<OrchestrationPlan | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  const runState = useAsyncState();
  const planState = useAsyncState();
  const { start: startRun, succeed: succeedRun, fail: failRun } = runState;
  const { start: startPlan, succeed: succeedPlan, fail: failPlan } = planState;

  // Load run data
  useEffect(() => {
    const loadRun = async () => {
      startRun();
      try {
        const runData = await getRun(runId);
        setRun(runData);
        succeedRun();

        // Load the associated plan
        if (runData.planId) {
          startPlan();
          try {
            const planData = await getPlan(runData.planId);
            setPlan(planData);
            succeedPlan();
          } catch (error) {
            failPlan(error);
          }
        }
      } catch (error) {
        failRun(error);
      }
    };

    loadRun();
  }, [runId, startRun, succeedRun, failRun, startPlan, succeedPlan, failPlan]);

  const getRunStepStates = (currentRun: OrchestrationRun): OrchestrationStepState[] => {
    const directStates = currentRun.stepStates;
    const fallbackStates = (currentRun as unknown as { steps?: OrchestrationStepState[] }).steps;
    return directStates && directStates.length > 0 ? directStates : fallbackStates || [];
  };

  const handleStepClick = (stepId: string) => {
    if (!run || !plan) return;

    const stepState = getRunStepStates(run).find(s => s.stepId === stepId);
    const step = plan.steps.find(s => s.id === stepId);
    const status = normalizeStepStatus(stepState?.status);

    // Allow manual steps to be completed when they are running or ready.
    const completableTypes = new Set(['manual']);
    if (step && completableTypes.has(step.type) && (status === 'running' || status === 'ready')) {
      setSelectedStepId(stepId);
      setIsCompletionModalOpen(true);
    }
  };

  const handleStepCompleted = () => {
    // Reload the run data to get updated step states
    const loadRun = async () => {
      try {
        const runData = await getRun(runId);
        setRun(runData);
      } catch (error) {
        console.error('Failed to reload run:', error);
      }
    };

    loadRun();
    setIsCompletionModalOpen(false);
    setSelectedStepId(null);
  };

  const getRunStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'blocked':
        return 'text-amber-600 bg-amber-100';
      case 'created':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const normalizeStepStatus = (status?: string): string => {
    if (!status) return 'pending';
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'completed':
      case 'complete':
        return 'succeeded';
      case 'in_progress':
      case 'in-progress':
      case 'inprogress':
        return 'running';
      default:
        return normalized;
    }
  };

  const calculateProgress = (): { completed: number; total: number; percentage: number } => {
    if (!run) return { completed: 0, total: 0, percentage: 0 };
    const runStepStates = getRunStepStates(run);
    if (runStepStates.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const total = runStepStates.length;
    const completed = runStepStates.filter(step => step.status === 'succeeded').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  if (runState.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading run...</div>
      </div>
    );
  }

  if (runState.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800 font-medium">Error loading run</div>
        <div className="text-red-600 text-sm mt-1">{runState.error}</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="text-yellow-800 font-medium">Run not found</div>
        <div className="text-yellow-600 text-sm mt-1">
          The requested run could not be found.
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const runStepStates = run ? getRunStepStates(run) : [];

  return (
    <div className="space-y-6">
      {/* Run Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {plan?.title ?? `Run ${run.id}`}
              </h1>
              <span
                className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${getRunStatusColor(run.status)}
                `}
              >
                {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
              </span>
            </div>

            {plan?.description && (
              <p className="text-gray-600 mb-3">
                {plan.description}
              </p>
            )}

            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-500">Run Id:</span>{' '}
              <span className="font-mono text-[11px] text-gray-600">{run.id}</span>
            </div>
          </div>

          <div className="md:justify-self-end flex flex-wrap items-center gap-2">
            <a
              href={`/orchestration/plans/${run.planId}`}
              className="inline-flex items-center gap-1 rounded-lg border border-[#8fdede] bg-white px-2 py-1 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:text-[#0b1517]"
            >
              View plan
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            {plan?.url && (
              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-[#8fdede] bg-white px-2 py-1 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:text-[#0b1517]"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open plan in Tool
              </a>
            )}
            {run.url && (
              <a
                href={run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-[#8fdede] bg-white px-2 py-1 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:text-[#0b1517]"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open run in Tool
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-4 text-sm text-gray-500 md:col-span-2">
            <div>
              <span className="font-medium">Plan:</span> {run.planId}
            </div>
            <div>
              <span className="font-medium">Progress:</span> {progress.completed}/{progress.total} steps ({progress.percentage}%)
            </div>
            <div>
              <span className="font-medium">Created:</span> {formatDate(run.createdAt)}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {formatDate(run.updatedAt)}
            </div>
            {plan?.version && (
              <div>
                <span className="font-medium">Version:</span> {plan.version}
              </div>
            )}
            {plan && Object.keys(plan.tags).length > 0 && (
              <div>
                <span className="font-medium">Tags:</span>{' '}
                {Object.entries(plan.tags).map(([key, value]) => (
                  <span key={key} className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-1">
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${run.status === 'completed' ? 'bg-green-500' :
                  run.status === 'failed' ? 'bg-red-500' :
                    run.status === 'blocked' ? 'bg-amber-500' :
                      'bg-blue-500'
                }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Workflow Visualizer */}
      {plan && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Workflow Progress
          </h2>

          <WorkflowVisualizer
            steps={plan.steps}
            stepStates={runStepStates}
            onStepClick={handleStepClick}
            className="h-[32rem]"
          />
        </div>
      )}

      {/* Step Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Step Timeline
        </h2>

        <div className="space-y-4">
          {runStepStates.map((stepState, index) => {
            const step = plan?.steps.find(s => s.id === stepState.stepId);
            if (!step) return null;
            const normalizedStatus = normalizeStepStatus(stepState.status);

            return (
              <div key={stepState.stepId} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-100 text-gray-600">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{step.title}</h3>
                    <span
                      className={`
                        inline-flex items-center px-2 py-1 rounded text-xs font-medium
                        ${normalizedStatus === 'succeeded' ? 'bg-green-100 text-green-800' :
                          normalizedStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            normalizedStatus === 'running' ? 'bg-blue-100 text-blue-800' :
                              normalizedStatus === 'blocked' ? 'bg-amber-100 text-amber-800' :
                                normalizedStatus === 'ready' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                        }
                      `}
                    >
                      {normalizedStatus}
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {step.type}
                    </span>
                  </div>

                  {step.description && (
                    <p className="text-gray-600 text-sm mb-2">
                      <MarkdownText text={step.description} />
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {stepState.startedAt && (
                      <div>Started: {formatDate(stepState.startedAt)}</div>
                    )}
                    {stepState.finishedAt && (
                      <div>Finished: {formatDate(stepState.finishedAt)}</div>
                    )}
                    {stepState.actor && (
                      <div>Actor: {stepState.actor}</div>
                    )}
                  </div>

                  {stepState.note && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      <span className="font-medium">Note:</span> {stepState.note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Completion Modal */}
      {isCompletionModalOpen && selectedStepId && plan && (
        <StepCompletionModal
          runId={run.id}
          stepId={selectedStepId}
          step={plan.steps.find(s => s.id === selectedStepId)!}
          onClose={() => setIsCompletionModalOpen(false)}
          onCompleted={handleStepCompleted}
        />
      )}
    </div>
  );
}
