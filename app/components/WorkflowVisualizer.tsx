'use client';

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { OrchestrationStep, OrchestrationStepState, StepStatus } from '@/app/lib/types';
import { MarkdownText } from '@/app/components/MarkdownText';
import {
  buildHighlightedEdges,
  buildHighlightedNodes,
  buildLevelGroups,
  computeEdgePaths,
  getBranchLabels,
  getEdgeCounts,
  getIncomingSources,
  getOutgoingTargets,
  getStatusColor,
  getStatusIcon,
  getStepStatus,
  getStepTypeMeta,
  normalizeStepStatus,
  sortStepsForLevel,
  type EdgePath,
} from '@/app/lib/workflow';

interface WorkflowVisualizerProps {
  steps: OrchestrationStep[];
  stepStates?: OrchestrationStepState[];
  onStepClick?: (stepId: string) => void;
  className?: string;
}


type StepCardProps = {
  step: OrchestrationStep;
  status: StepStatus;
  statusColor: string;
  showStatus: boolean;
  branchLabel?: string;
  isDimmed?: boolean;
  onClick?: (stepId: string) => void;
  cardRef?: React.Ref<HTMLButtonElement>;
};

function StepCard({
  step,
  status,
  statusColor,
  showStatus,
  branchLabel,
  isDimmed,
  onClick,
  cardRef,
}: StepCardProps) {
  const { label, badge } = getStepTypeMeta(step.type);
  const handleClick = () => {
    onClick?.(step.id);
  };
  const isActive = showStatus && (status === 'running' || status === 'ready');
  const isComplete = showStatus && status === 'succeeded';
  const borderColor = showStatus ? statusColor : '#e5e7eb';
  const badgeColor = showStatus ? statusColor : '#94a3b8';

  return (
    <button
      type="button"
      onClick={handleClick}
      ref={cardRef}
      className={`
        w-full text-left px-3 py-2 shadow-sm rounded-md border-2
        hover:shadow-md transition-shadow duration-200
        ${isActive ? 'bg-blue-50/60 shadow-md' : 'bg-white'}
        ${isComplete ? 'opacity-80' : 'opacity-100'}
        ${status === 'running' ? 'animate-pulse' : ''}
        ${isDimmed ? 'opacity-40' : ''}
      `}
      style={{ borderColor }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
          style={{ backgroundColor: badgeColor }}
        >
          {badge}
        </div>
        <div className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.14em]">
          {label}
        </div>
        {showStatus && (
          <div className="ml-auto text-base" style={{ color: statusColor }}>
            {getStatusIcon(status)}
          </div>
        )}
      </div>

      {branchLabel && (
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
          {branchLabel}
        </div>
      )}

      <div className={`font-medium text-gray-900 text-sm mb-1 ${isActive ? 'underline decoration-2 decoration-blue-400/60' : ''}`}>
        {step.title}
      </div>

      {step.description && (
        <div className="text-[12px] text-gray-600 line-clamp-2">
          <MarkdownText text={step.description} />
        </div>
      )}

      {showStatus && (
        <div className="mt-2 text-[11px] font-medium" style={{ color: statusColor }}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      )}
    </button>
  );
}

export function WorkflowVisualizer({
  steps,
  stepStates,
  onStepClick,
  className = ''
}: WorkflowVisualizerProps) {
  const { levelGroups } = useMemo(() => buildLevelGroups(steps), [steps]);
  const orderedLevels = useMemo(
    () => Array.from(levelGroups.keys()).sort((a, b) => a - b),
    [levelGroups]
  );
  const showStatus = Boolean(stepStates && stepStates.length > 0);
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);
  const stepById = useMemo(() => new Map(steps.map(step => [step.id, step])), [steps]);
  const branchLabels = useMemo(() => getBranchLabels(steps), [steps]);
  const edgeCounts = useMemo(() => getEdgeCounts(steps), [steps]);
  const maxParallel = useMemo(() => {
    const counts = orderedLevels.map(level => (levelGroups.get(level) || []).length);
    return Math.max(1, ...counts);
  }, [orderedLevels, levelGroups]);
  const [columnCount, setColumnCount] = useState(1);
  const outgoingTargets = useMemo(() => getOutgoingTargets(steps), [steps]);
  const incomingSources = useMemo(() => getIncomingSources(steps), [steps]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [edgePaths, setEdgePaths] = useState<EdgePath[]>([]);
  const [svgSize, setSvgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const setCardRef = useCallback(
    (stepId: string) => (node: HTMLButtonElement | null) => {
      if (node) {
        cardRefs.current.set(stepId, node);
      } else {
        cardRefs.current.delete(stepId);
      }
    },
    []
  );

  const highlightedEdges = useMemo(
    () => buildHighlightedEdges(hoveredStepId, outgoingTargets, incomingSources),
    [hoveredStepId, outgoingTargets, incomingSources]
  );
  const highlightedNodes = useMemo(
    () => buildHighlightedNodes(hoveredStepId, outgoingTargets, incomingSources),
    [hoveredStepId, outgoingTargets, incomingSources]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport) return;

    const updateColumns = () => {
      const width = viewport.getBoundingClientRect().width;
      const minCardWidth = 220;
      const gap = 24;
      const maxColumns = Math.max(1, Math.floor((width + gap) / (minCardWidth + gap)));
      const nextColumns = Math.max(3, Math.min(maxParallel, maxColumns));
      setColumnCount(nextColumns);
    };

    const computeEdges = () => {
      const containerRect = container.getBoundingClientRect();
      const nodeRects = new Map<string, { left: number; right: number; top: number; bottom: number }>();

      cardRefs.current.forEach((node, stepId) => {
        const rect = node.getBoundingClientRect();
        nodeRects.set(stepId, {
          left: rect.left - containerRect.left,
          right: rect.right - containerRect.left,
          top: rect.top - containerRect.top,
          bottom: rect.bottom - containerRect.top,
        });
      });

      const statusById = new Map(
        (stepStates || []).map(state => [state.stepId, normalizeStepStatus(state.status)])
      );

      const paths = computeEdgePaths({
        stepById,
        nodeRects,
        statusById,
        edgeCounts,
        outgoingTargets,
        showStatus,
        highlightedEdges,
        hoveredStepId,
      });

      setEdgePaths(paths);
      setSvgSize({ width: container.scrollWidth, height: container.scrollHeight });
    };

    updateColumns();
    computeEdges();
    const resizeObserver = new ResizeObserver(() => {
      updateColumns();
      computeEdges();
    });
    resizeObserver.observe(viewport);
    window.addEventListener('resize', computeEdges);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', computeEdges);
    };
  }, [steps, orderedLevels, stepStates, showStatus, hoveredStepId, highlightedEdges, edgeCounts, outgoingTargets, stepById, maxParallel]);

  return (
    <div className={`h-96 w-full min-w-0 border border-gray-200 rounded-lg ${className}`}>
      <div ref={viewportRef} className="h-full w-full min-w-0 overflow-x-auto overflow-y-auto">
        <div
          ref={containerRef}
          className="relative flex flex-col gap-10 px-6 py-6"
          style={{ width: '100%' }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            width={svgSize.width}
            height={svgSize.height}
            viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
            aria-hidden="true"
          >
            <defs>
              <marker
                id="flow-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {edgePaths.map(path => (
              <path
                key={path.id}
                d={path.d}
                stroke={path.color}
                strokeWidth="2"
                markerEnd={path.arrow ? 'url(#flow-arrow)' : undefined}
                fill="none"
                opacity={
                  path.blocked && !hoveredStepId
                    ? 0
                    : path.blocked && hoveredStepId && !highlightedEdges.has(path.id)
                      ? 0
                      : path.opacity
                }
              />
            ))}
          </svg>
          {orderedLevels.map((level) => {
            const stepsInLevel = levelGroups.get(level) || [];
            const sortedSteps = sortStepsForLevel(stepsInLevel, outgoingTargets);
            const startColumn = Math.max(1, Math.floor((columnCount - sortedSteps.length) / 2) + 1);
            const shouldWrap = sortedSteps.length > columnCount;

            return (
              <React.Fragment key={level}>
                <div
                  className="grid gap-6 w-full min-w-0"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(1, columnCount)}, minmax(220px, 1fr))`,
                  }}
                >
                  {sortedSteps.map((step, index) => {
                    const status = getStepStatus(step.id, stepStates);
                    const branchLabel = branchLabels.get(step.id);
                    const isDimmed = hoveredStepId ? !highlightedNodes.has(step.id) : false;
                    const useColumn = shouldWrap ? 'auto' : startColumn + index;

                    return (
                      <div
                        key={step.id}
                        style={{ gridColumn: useColumn }}
                        onMouseEnter={() => setHoveredStepId(step.id)}
                        onMouseLeave={() => setHoveredStepId(null)}
                      >
                        <StepCard
                          step={step}
                          status={status}
                          statusColor={getStatusColor(status)}
                          showStatus={showStatus}
                          branchLabel={branchLabel}
                          isDimmed={isDimmed}
                          onClick={onStepClick}
                          cardRef={setCardRef(step.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
