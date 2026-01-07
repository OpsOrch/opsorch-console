'use client';

import React from 'react';
import { OrchestrationRun, OrchestrationStepState, RunStatus } from '@/app/lib/types';
import { formatDate } from '@/app/lib/utils';

interface RunItemProps {
  run: OrchestrationRun;
  onClick: () => void;
}

export function RunItem({ run, onClick }: RunItemProps) {
  const getStatusColor = (status: RunStatus): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'created':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: RunStatus): string => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'running':
        return '⟳';
      case 'blocked':
        return '⚠';
      case 'created':
        return '○';
      case 'cancelled':
        return '⏹';
      default:
        return '○';
    }
  };

  const getRunStepStates = (currentRun: OrchestrationRun): OrchestrationStepState[] => {
    const directStates = currentRun.stepStates;
    const fallbackStates = (currentRun as unknown as { steps?: OrchestrationStepState[] }).steps;
    return directStates && directStates.length > 0 ? directStates : fallbackStates || [];
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
    const stepStates = getRunStepStates(run);
    const total = stepStates.length;
    const completed = stepStates.filter(step => normalizeStepStatus(step.status) === 'succeeded').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const progress = calculateProgress();
  const isBlocked = run.status === 'blocked';

  return (
    <div
      onClick={onClick}
      className={`
        p-4 hover:bg-gray-50 cursor-pointer transition-colors
        ${isBlocked ? 'bg-amber-50 border-l-4 border-amber-400' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Run Header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-mono text-gray-900">
                {run.id}
              </span>
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
                  ${getStatusColor(run.status)}
                `}
              >
                <span>{getStatusIcon(run.status)}</span>
                {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
              </span>
            </div>
            
            {isBlocked && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Needs Attention
              </span>
            )}
          </div>

          {/* Plan Information */}
          <div className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Plan:</span>{' '}
            <a
              href={`/orchestration/plans/${run.planId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:text-blue-800"
            >
              {run.planId}
            </a>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress.completed}/{progress.total} steps ({progress.percentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  run.status === 'completed' ? 'bg-green-500' :
                  run.status === 'failed' ? 'bg-red-500' :
                  run.status === 'blocked' ? 'bg-amber-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Created:</span> {formatDate(run.createdAt)}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {formatDate(run.updatedAt)}
            </div>
          </div>

          {/* Upstream Link */}
        </div>

        {/* Action Indicator */}
        <div className="ml-4 flex-shrink-0">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
