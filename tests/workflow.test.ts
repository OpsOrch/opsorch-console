import assert from "node:assert";
import test from "node:test";
import {
  buildHighlightedEdges,
  buildHighlightedNodes,
  buildLevelGroups,
  computeEdgePaths,
  getEdgeCounts,
  getIncomingSources,
  getOutgoingTargets,
  normalizeStepStatus,
  sortStepsForLevel,
} from "../app/lib/workflow.js";
import type { OrchestrationStep, StepStatus } from "../app/lib/types.js";

const baseMeta = {};

const step1: OrchestrationStep = {
  id: "step-1",
  title: "Start",
  description: "start",
  type: "manual",
  metadata: baseMeta,
};

const step2: OrchestrationStep = {
  id: "step-2",
  title: "Next",
  description: "next",
  type: "manual",
  dependsOn: ["step-1"],
  metadata: baseMeta,
};

const step3: OrchestrationStep = {
  id: "step-3",
  title: "Sibling",
  description: "sibling",
  type: "manual",
  dependsOn: ["step-1"],
  metadata: baseMeta,
};

test("normalizeStepStatus maps backend variants", () => {
  assert.equal(normalizeStepStatus("completed"), "succeeded");
  assert.equal(normalizeStepStatus("in_progress"), "running");
  assert.equal(normalizeStepStatus("pending"), "pending");
  assert.equal(normalizeStepStatus(undefined), "pending");
});

test("buildLevelGroups groups steps by dependency depth", () => {
  const { levelGroups } = buildLevelGroups([step1, step2, step3]);
  assert.equal(levelGroups.get(0)?.length, 1);
  assert.equal(levelGroups.get(1)?.length, 2);
});

test("incoming/outgoing maps reflect dependencies", () => {
  const outgoing = getOutgoingTargets([step1, step2, step3]);
  const incoming = getIncomingSources([step1, step2, step3]);
  assert.deepEqual(outgoing.get("step-1"), ["step-2", "step-3"]);
  assert.deepEqual(incoming.get("step-2"), ["step-1"]);
  assert.deepEqual(incoming.get("step-3"), ["step-1"]);
});

test("edge counts track fan-in and fan-out", () => {
  const { inCounts, outCounts } = getEdgeCounts([step1, step2, step3]);
  assert.equal(inCounts.get("step-1"), 0);
  assert.equal(inCounts.get("step-2"), 1);
  assert.equal(outCounts.get("step-1"), 2);
});

test("sortStepsForLevel groups by shared deps and targets", () => {
  const outgoing = getOutgoingTargets([step1, step2, step3]);
  const sorted = sortStepsForLevel([step3, step2], outgoing);
  assert.deepEqual(sorted.map((s) => s.id), ["step-2", "step-3"]);
});

test("highlight helpers include incoming/outgoing edges and nodes", () => {
  const outgoing = getOutgoingTargets([step1, step2, step3]);
  const incoming = getIncomingSources([step1, step2, step3]);
  const edges = buildHighlightedEdges("step-1", outgoing, incoming);
  assert(edges.has("step-1-step-2"));
  assert(edges.has("step-1-step-3"));
  const nodes = buildHighlightedNodes("step-2", outgoing, incoming);
  assert(nodes.has("step-1"));
  assert(nodes.has("step-2"));
});

test("computeEdgePaths builds trunk + branches for fan-out", () => {
  const steps = [step1, step2, step3];
  const stepById = new Map(steps.map((s) => [s.id, s]));
  const nodeRects = new Map([
    ["step-1", { left: 100, right: 200, top: 20, bottom: 70 }],
    ["step-2", { left: 80, right: 180, top: 220, bottom: 270 }],
    ["step-3", { left: 220, right: 320, top: 220, bottom: 270 }],
  ]);
  const statusById = new Map<string, StepStatus>([
    ["step-1", "succeeded"],
    ["step-2", "pending"],
    ["step-3", "pending"],
  ]);
  const edgeCounts = getEdgeCounts(steps);
  const outgoingTargets = getOutgoingTargets(steps);
  const paths = computeEdgePaths({
    stepById,
    nodeRects,
    statusById,
    edgeCounts,
    outgoingTargets,
    showStatus: false,
    highlightedEdges: new Set(),
    hoveredStepId: null,
  });

  const ids = paths.map((p) => p.id);
  assert(ids.includes("step-1-trunk"));
  assert(ids.includes("step-1-step-2"));
  assert(ids.includes("step-1-step-3"));
});

test("computeEdgePaths flags blocked edges", () => {
  const steps = [step1, step2, step3];
  const stepById = new Map(steps.map((s) => [s.id, s]));
  const nodeRects = new Map([
    ["step-1", { left: 100, right: 200, top: 20, bottom: 70 }],
    ["step-2", { left: 100, right: 200, top: 220, bottom: 270 }],
    ["step-3", { left: 120, right: 220, top: 120, bottom: 180 }],
  ]);
  const statusById = new Map<string, StepStatus>([
    ["step-1", "succeeded"],
    ["step-2", "pending"],
    ["step-3", "pending"],
  ]);
  const edgeCounts = getEdgeCounts(steps);
  const outgoingTargets = getOutgoingTargets(steps);
  const paths = computeEdgePaths({
    stepById,
    nodeRects,
    statusById,
    edgeCounts,
    outgoingTargets,
    showStatus: false,
    highlightedEdges: new Set(),
    hoveredStepId: null,
  });

  const blockedEdge = paths.find((p) => p.id === "step-1-step-2");
  assert.equal(blockedEdge?.blocked, true);
});
