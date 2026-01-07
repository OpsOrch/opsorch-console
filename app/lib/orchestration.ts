import { requestJSON } from "@/app/lib/api";
import { 
  OrchestrationPlan, 
  OrchestrationRun, 
  PlanQuery, 
  RunQuery, 
  CompleteStepRequest 
} from "@/app/lib/types";

export async function queryPlans(planQuery?: Partial<PlanQuery>) {
  const body: PlanQuery = {
    query: planQuery?.query,
    tags: planQuery?.tags,
    scope: planQuery?.scope,
    limit: planQuery?.limit,
  };

  // Remove undefined fields
  Object.keys(body).forEach(key => {
    if (body[key as keyof PlanQuery] === undefined) {
      delete body[key as keyof PlanQuery];
    }
  });

  return requestJSON<OrchestrationPlan[]>("/orchestration/plans/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getPlan(planId: string) {
  return requestJSON<OrchestrationPlan>(`/orchestration/plans/${planId}`);
}

export async function queryRuns(runQuery?: Partial<RunQuery>) {
  const body: RunQuery = {
    statuses: runQuery?.statuses,
    planIds: runQuery?.planIds,
    scope: runQuery?.scope,
    limit: runQuery?.limit,
  };

  // Remove undefined fields
  Object.keys(body).forEach(key => {
    if (body[key as keyof RunQuery] === undefined) {
      delete body[key as keyof RunQuery];
    }
  });

  return requestJSON<OrchestrationRun[]>("/orchestration/runs/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getRun(runId: string) {
  return requestJSON<OrchestrationRun>(`/orchestration/runs/${runId}`);
}

export async function startRun(planId: string) {
  return requestJSON<OrchestrationRun>("/orchestration/runs", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

export async function completeStep(runId: string, stepId: string, note?: string) {
  const body: CompleteStepRequest = {
    note,
    // actor will be populated by the backend from user context
  };

  return requestJSON<void>(`/orchestration/runs/${runId}/steps/${stepId}/complete`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
