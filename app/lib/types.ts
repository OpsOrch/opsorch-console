export type Incident = {
  id: string;
  title: string;
  status: string;
  severity: string;
  service?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type TimelineEntry = {
  id: string;
  incidentId: string;
  at: string;
  kind: string;
  body: string;
  actor?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type LogMessage = string | number | boolean | Record<string, unknown> | unknown[];

export type LogEntry = {
  timestamp: string;
  message: LogMessage;
  severity?: string;
  service?: string;
  labels?: Record<string, string>;
  fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type LogEntries = {
  entries: LogEntry[];
  url?: string;
};

export type MetricSeries = {
  name: string;
  service?: string;
  labels?: Record<string, unknown>;
  points: { timestamp: string; value: number }[];
  url?: string;
  metadata?: Record<string, unknown>;
};

export type MetricDescriptor = {
  name: string;
  type: string;
  description: string;
  labels?: string[];
  unit?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export type QueryScope = {
  service?: string;
  environment?: string;
  team?: string;
};

export type LogFilter = {
  field: string;
  operator: string;
  value: string;
};

export type LogExpression = {
  search?: string;
  filters?: LogFilter[];
  severityIn?: string[];
};

export type MetricFilter = {
  label: string;
  operator: string;
  value: string;
};

export type MetricExpression = {
  metricName: string;
  aggregation?: string;
  filters?: MetricFilter[];
  groupBy?: string[];
};

export type Ticket = {
  id: string;
  key?: string;
  title: string;
  description?: string;
  status: string;
  assignees?: string[];
  reporter?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type MessageResult = {
  id: string;
  channel: string;
  provider: string;
  sentAt: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export type Service = {
  id: string;
  name: string;
  url?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
};

export type Team = {
  id: string;
  name: string;
  parent?: string;
  url?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: string;
  metadata?: Record<string, unknown>;
};

export type TeamQuery = {
  name?: string;
  tags?: Record<string, string>;
  scope?: QueryScope;
  limit?: number;
  metadata?: Record<string, unknown>;
};

export type Deployment = {
  id: string;
  service?: string;
  environment?: string;
  version?: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  url?: string;
  actor?: Record<string, unknown>;
  fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type CopilotLink = {
  label: string;
  url: string;
};

export type MetricReference = {
  expression: MetricExpression;
  start?: string;
  end?: string;
  step?: number;
  scope?: QueryScope;
};

export type LogReference = {
  expression: LogExpression;
  start?: string;
  end?: string;
  scope?: QueryScope;
};

export type CopilotReferences = {
  incidents?: (string | Partial<IncidentQuery>)[];
  alerts?: (string | Partial<AlertQuery>)[];
  services?: string[];
  metrics?: MetricReference[];
  logs?: LogReference[];
  tickets?: string[];
  deployments?: (string | DeploymentReference | Partial<DeploymentQuery>)[];
  teams?: string[];
};

export type CopilotAnswer = {
  conclusion: string;
  missing?: string[];
  references?: CopilotReferences;
  confidence?: number;
  chatId?: string;
  executionTrace?: TurnExecutionTrace;
};

// Execution trace types for Copilot answer traceability
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type TurnExecutionTrace = {
  traceId: string;
  startTime: number;
  endTime: number;
  totalDurationMs: number;
  iterations: IterationTrace[];
};

export type IterationTrace = {
  iterationNumber: number;
  plannedTools: ToolCall[];
  heuristicModifications: HeuristicModification[];
  toolExecutions: ToolExecutionTrace[];
  durationMs: number;
};

export type ToolExecutionTrace = {
  toolName: string;
  arguments?: JsonObject;
  cacheHit: boolean;
  executionTimeMs: number;
  success: boolean;
  error?: string;
};

export type ToolCall = {
  name: string;
  arguments: JsonObject;
};

export type HeuristicModification = {
  heuristicName: string;
  action: "inject" | "modify" | "remove";
  reason: string;
  affectedTools?: string[];
};

export type ChatConversation = {
  chatId: string;
  name: string;
  createdAt: number;
  lastAccessedAt: number;
  turnCount: number;
  preview?: string;
};

export type MatchingTurn = {
  turnIndex: number;
  snippet: string;
  timestamp: number;
  matchType: 'user' | 'assistant' | 'entity';
};

export type ChatSearchResult = {
  chatId: string;
  name: string;
  createdAt: number;
  lastAccessedAt: number;
  turnCount: number;
  matchCount: number;
  matchingTurns: MatchingTurn[];
  matchedEntities?: {
    type: 'incident' | 'service' | 'ticket' | 'timestamp';
    value: string;
  }[];
};

export type ChatSearchResponse = {
  query: string;
  limit: number;
  totalResults: number;
  returnedResults: number;
  results: ChatSearchResult[];
};

export type Alert = {
  id: string;
  title: string;
  description?: string;
  status: string;
  severity: string;
  service?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type AlertQuery = {
  query?: string;
  statuses?: string[];
  severities?: string[];
  scope?: QueryScope;
  limit?: number;
  metadata?: Record<string, unknown>;
};

export type IncidentQuery = {
  query?: string;
  statuses?: string[];
  severities?: string[];
  scope?: QueryScope;
  limit?: number;
  metadata?: Record<string, unknown>;
};

export type DeploymentQuery = {
  query?: string;
  statuses?: string[];
  versions?: string[];
  scope?: QueryScope;
  limit?: number;
  metadata?: Record<string, unknown>;
};

export type DeploymentReference = {
  query?: DeploymentQuery;
  deploymentId?: string;
};
