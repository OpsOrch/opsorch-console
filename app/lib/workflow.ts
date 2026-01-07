import { OrchestrationStep, OrchestrationStepState, StepStatus } from '@/app/lib/types';

export type LevelGroups = Map<number, OrchestrationStep[]>;
export type Rect = { left: number; right: number; top: number; bottom: number };
export type EdgePath = { id: string; d: string; color: string; opacity: number; arrow: boolean; blocked: boolean };

const NODE_COLORS = [
  '#0ea5e9', // sky-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#f43f5e', // rose-500
  '#6366f1', // indigo-500
  '#eab308', // amber-500
  '#10b981', // emerald-500
];

export function normalizeStepStatus(status?: string): StepStatus {
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
    default: {
      const allowed: StepStatus[] = [
        'pending',
        'ready',
        'running',
        'blocked',
        'succeeded',
        'failed',
        'skipped',
        'cancelled',
      ];
      return allowed.includes(normalized as StepStatus) ? (normalized as StepStatus) : 'pending';
    }
  }
}

export function getStepStatus(stepId: string, stepStates?: OrchestrationStepState[]): StepStatus {
  const state = stepStates?.find(s => s.stepId === stepId);
  return normalizeStepStatus(state?.status);
}

export function getStatusColor(status: StepStatus): string {
  switch (status) {
    case 'succeeded':
      return '#10b981'; // green-500
    case 'failed':
      return '#ef4444'; // red-500
    case 'running':
      return '#3b82f6'; // blue-500
    case 'blocked':
      return '#f59e0b'; // amber-500
    case 'ready':
      return '#8b5cf6'; // violet-500
    case 'pending':
      return '#6b7280'; // gray-500
    case 'skipped':
      return '#9ca3af'; // gray-400
    case 'cancelled':
      return '#6b7280'; // gray-500
    default:
      return '#6b7280'; // gray-500
  }
}

export function getStatusIcon(status: StepStatus): string {
  switch (status) {
    case 'succeeded':
      return '✓';
    case 'failed':
      return '✗';
    case 'running':
      return '⟳';
    case 'blocked':
      return '⚠';
    case 'ready':
      return '▶';
    case 'pending':
      return '⏸';
    case 'skipped':
      return '⏭';
    case 'cancelled':
      return '⏹';
    default:
      return '○';
  }
}

export function getStepTypeMeta(type: string): { label: string; badge: string } {
  switch (type) {
    case 'manual':
      return { label: 'Manual', badge: 'M' };
    case 'automated':
      return { label: 'Automated', badge: 'A' };
    case 'observe':
      return { label: 'Observe', badge: 'O' };
    case 'invoke':
      return { label: 'Invoke', badge: 'I' };
    case 'verify':
      return { label: 'Verify', badge: 'V' };
    case 'record':
      return { label: 'Record', badge: 'R' };
    default:
      return { label: 'Step', badge: 'S' };
  }
}

export function getNodeColor(stepId: string): string {
  let hash = 0;
  for (let i = 0; i < stepId.length; i += 1) {
    hash = (hash * 31 + stepId.charCodeAt(i)) % NODE_COLORS.length;
  }
  return NODE_COLORS[hash];
}

export function getEdgeColor(sourceId: string, targetId: string, sourceOut: number, targetIn: number): string {
  if (sourceOut > 1) {
    return getNodeColor(sourceId);
  }
  if (targetIn > 1) {
    return getNodeColor(targetId);
  }
  return getNodeColor(sourceId);
}

export function getLaneOffset(stepId: string): number {
  let hash = 0;
  for (let i = 0; i < stepId.length; i += 1) {
    hash = (hash * 17 + stepId.charCodeAt(i)) % 3;
  }
  return (hash - 1) * 10;
}

export function buildLevelGroups(steps: OrchestrationStep[]): {
  levelGroups: LevelGroups;
  stepTitleById: Map<string, string>;
} {
  const stepMap = new Map(steps.map(step => [step.id, step]));
  const levels = new Map<string, number>();
  const visiting = new Set<string>();

  function calculateLevel(stepId: string): number {
    if (levels.has(stepId)) {
      return levels.get(stepId)!;
    }
    if (visiting.has(stepId)) {
      return 0;
    }

    const step = stepMap.get(stepId);
    if (!step) return 0;

    visiting.add(stepId);
    let maxDepLevel = -1;
    for (const depId of step.dependsOn || []) {
      maxDepLevel = Math.max(maxDepLevel, calculateLevel(depId));
    }
    visiting.delete(stepId);

    const level = maxDepLevel + 1;
    levels.set(stepId, level);
    return level;
  }

  steps.forEach(step => calculateLevel(step.id));

  const levelGroups: LevelGroups = new Map();
  steps.forEach(step => {
    const level = levels.get(step.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(step);
  });

  const stepTitleById = new Map(steps.map(step => [step.id, step.title]));

  return { levelGroups, stepTitleById };
}

export function getOutgoingTargets(steps: OrchestrationStep[]): Map<string, string[]> {
  const outgoing = new Map<string, string[]>();
  steps.forEach(step => {
    (step.dependsOn || []).forEach(depId => {
      if (!outgoing.has(depId)) {
        outgoing.set(depId, []);
      }
      outgoing.get(depId)!.push(step.id);
    });
  });
  outgoing.forEach((targets, key) => {
    outgoing.set(key, [...targets].sort());
  });
  return outgoing;
}

export function getIncomingSources(steps: OrchestrationStep[]): Map<string, string[]> {
  const incoming = new Map<string, string[]>();
  steps.forEach(step => {
    (step.dependsOn || []).forEach(depId => {
      if (!incoming.has(step.id)) {
        incoming.set(step.id, []);
      }
      incoming.get(step.id)!.push(depId);
    });
  });
  incoming.forEach((sources, key) => {
    incoming.set(key, [...sources].sort());
  });
  return incoming;
}

export function getBranchLabels(steps: OrchestrationStep[]): Map<string, string> {
  const branchLabelByStep = new Map<string, string>();
  const detectBranchLabel = (step: OrchestrationStep) => {
    const title = step.title.toLowerCase();
    if (title.includes('db') || title.includes('database')) return 'Database';
    if (title.includes('compute') || title.includes('cluster') || title.includes('kubernetes')) return 'Compute';
    if (title.includes('storage')) return 'Storage';
    return 'Branch';
  };
  steps.forEach(step => branchLabelByStep.set(step.id, detectBranchLabel(step)));
  return branchLabelByStep;
}

export function getEdgeCounts(steps: OrchestrationStep[]): {
  inCounts: Map<string, number>;
  outCounts: Map<string, number>;
} {
  const inCounts = new Map<string, number>();
  const outCounts = new Map<string, number>();
  steps.forEach(step => {
    const deps = step.dependsOn || [];
    inCounts.set(step.id, deps.length);
    deps.forEach(depId => {
      outCounts.set(depId, (outCounts.get(depId) || 0) + 1);
    });
  });
  return { inCounts, outCounts };
}

export function sortStepsForLevel(
  stepsInLevel: OrchestrationStep[],
  outgoingTargets: Map<string, string[]>
): OrchestrationStep[] {
  return [...stepsInLevel].sort((a, b) => {
    const aTargets = outgoingTargets.get(a.id)?.join('|') || '';
    const bTargets = outgoingTargets.get(b.id)?.join('|') || '';
    const aDeps = (a.dependsOn || []).slice().sort().join('|');
    const bDeps = (b.dependsOn || []).slice().sort().join('|');
    if (aDeps !== bDeps) return aDeps.localeCompare(bDeps);
    if (aTargets !== bTargets) return aTargets.localeCompare(bTargets);
    const depsA = a.dependsOn?.length ?? 0;
    const depsB = b.dependsOn?.length ?? 0;
    if (depsA !== depsB) return depsA - depsB;
    return a.title.localeCompare(b.title);
  });
}

export function buildHighlightedEdges(
  hoveredStepId: string | null,
  outgoingTargets: Map<string, string[]>,
  incomingSources: Map<string, string[]>
): Set<string> {
  if (!hoveredStepId) return new Set<string>();
  const highlight = new Set<string>();
  const outgoing = outgoingTargets.get(hoveredStepId) || [];
  outgoing.forEach(targetId => {
    highlight.add(`${hoveredStepId}-${targetId}`);
    highlight.add(`${hoveredStepId}-trunk`);
  });
  const incoming = incomingSources.get(hoveredStepId) || [];
  incoming.forEach(sourceId => {
    highlight.add(`${sourceId}-${hoveredStepId}`);
    highlight.add(`${sourceId}-trunk`);
  });
  return highlight;
}

export function buildHighlightedNodes(
  hoveredStepId: string | null,
  outgoingTargets: Map<string, string[]>,
  incomingSources: Map<string, string[]>
): Set<string> {
  if (!hoveredStepId) return new Set<string>();
  const nodes = new Set<string>([hoveredStepId]);
  (outgoingTargets.get(hoveredStepId) || []).forEach(id => nodes.add(id));
  (incomingSources.get(hoveredStepId) || []).forEach(id => nodes.add(id));
  return nodes;
}

function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: Rect
): boolean {
  const padding = 6;
  const left = rect.left - padding;
  const right = rect.right + padding;
  const top = rect.top - padding;
  const bottom = rect.bottom + padding;

  if (x1 === x2) {
    if (x1 < left || x1 > right) return false;
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return maxY >= top && minY <= bottom;
  }
  if (y1 === y2) {
    if (y1 < top || y1 > bottom) return false;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    return maxX >= left && minX <= right;
  }
  return false;
}

export function computeEdgePaths(params: {
  stepById: Map<string, OrchestrationStep>;
  nodeRects: Map<string, Rect>;
  statusById: Map<string, StepStatus>;
  edgeCounts: { inCounts: Map<string, number>; outCounts: Map<string, number> };
  outgoingTargets: Map<string, string[]>;
  showStatus: boolean;
  highlightedEdges: Set<string>;
  hoveredStepId: string | null;
}): EdgePath[] {
  const {
    stepById,
    nodeRects,
    statusById,
    edgeCounts,
    outgoingTargets,
    showStatus,
    highlightedEdges,
    hoveredStepId,
  } = params;

  const paths: EdgePath[] = [];
  const nodeRectEntries = Array.from(nodeRects.entries());

  const outgoing = outgoingTargets;

  outgoing.forEach((targetIdsRaw, sourceId) => {
    const sourceRect = nodeRects.get(sourceId);
    if (!sourceRect) return;
    const targetIds = [...targetIdsRaw].sort();
    const x1 = (sourceRect.left + sourceRect.right) / 2;
    const y1 = sourceRect.bottom;
    const sourceFanOut = targetIds.length;

    const targets = targetIds
      .map(targetId => {
        const targetRect = nodeRects.get(targetId);
        if (!targetRect) return null;
        const targetStep = stepById.get(targetId);
        const deps = targetStep?.dependsOn || [];
        const x2 = (targetRect.left + targetRect.right) / 2;
        const y2 = targetRect.top;
        return { targetId, x2, y2, depsLength: deps.length };
      })
      .filter(Boolean) as { targetId: string; x2: number; y2: number; depsLength: number }[];

    if (targets.length === 0) return;

    const minY2 = Math.min(...targets.map(target => target.y2));
    const junctionY = Math.max(y1 + 12, minY2 - 16);
    const trunkOpacity = Math.max(
      ...targets.map(target => {
        const targetStatus = statusById.get(target.targetId) || 'pending';
        return showStatus && (targetStatus === 'running' || targetStatus === 'ready') ? 0.95 : 0.55;
      })
    );

    if (sourceFanOut > 1) {
      let trunkBlocked = false;
      nodeRectEntries.forEach(([rectId, rect]) => {
        if (rectId === sourceId) return;
        if (segmentIntersectsRect(x1, y1, x1, junctionY, rect)) {
          trunkBlocked = true;
        }
      });
      paths.push({
        id: `${sourceId}-trunk`,
        d: `M ${x1} ${y1} L ${x1} ${junctionY}`,
        color: getNodeColor(sourceId),
        opacity: trunkOpacity,
        arrow: false,
        blocked: trunkBlocked,
      });
    }

    targets.forEach(target => {
      const targetStatus = statusById.get(target.targetId) || 'pending';
      const edgeColor = getEdgeColor(
        sourceId,
        target.targetId,
        sourceFanOut,
        edgeCounts.inCounts.get(target.targetId) || 0
      );
      const edgeOpacity = showStatus && (targetStatus === 'running' || targetStatus === 'ready') ? 0.95 : 0.55;
      const minGap = 20;
      const yMidBase = Math.max(junctionY + 12, target.y2 - 36);
      const laneOffset = getLaneOffset(target.targetId);
      const yMid = Math.min(
        Math.max(yMidBase + laneOffset, junctionY + 12),
        target.y2 - minGap
      );
      const xMid = (x1 + target.x2) / 2;
      const startY = sourceFanOut > 1 ? junctionY : y1;

      let blocked = false;
      nodeRectEntries.forEach(([rectId, rect]) => {
        if (rectId === sourceId || rectId === target.targetId) return;
        if (
          segmentIntersectsRect(x1, startY, x1, yMid, rect) ||
          segmentIntersectsRect(x1, yMid, xMid, yMid, rect) ||
          segmentIntersectsRect(xMid, yMid, target.x2, yMid, rect) ||
          segmentIntersectsRect(target.x2, yMid, target.x2, target.y2, rect)
        ) {
          blocked = true;
        }
      });

      paths.push({
        id: `${sourceId}-${target.targetId}`,
        d: `M ${x1} ${startY} L ${x1} ${yMid} L ${xMid} ${yMid} L ${target.x2} ${yMid} L ${target.x2} ${target.y2}`,
        color: edgeColor,
        opacity: edgeOpacity,
        arrow: true,
        blocked,
      });
    });
  });

  return paths.map(path => {
    if (!hoveredStepId) return path;
    const isHighlighted = highlightedEdges.has(path.id);
    return {
      ...path,
      opacity: isHighlighted ? Math.min(1, path.opacity + 0.35) : 0.12,
    };
  });
}
