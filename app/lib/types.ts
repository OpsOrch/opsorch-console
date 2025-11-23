export type Incident = {
  id: string;
  title: string;
  status: string;
  severity: string;
  service?: string;
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

export type MetricSeries = {
  name: string;
  service?: string;
  labels?: Record<string, unknown>;
  points: { timestamp: string; value: number }[];
  metadata?: Record<string, unknown>;
};

export type QueryScope = {
  service?: string;
  environment?: string;
  team?: string;
};

export type Ticket = {
  id: string;
  key?: string;
  title: string;
  description?: string;
  status: string;
  assignees?: string[];
  reporter?: string;
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
  metadata?: Record<string, unknown>;
};

export type Service = {
  id: string;
  name: string;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
};

export type CopilotLink = {
  label: string;
  url: string;
};

export type MetricReference = {
  expression: string;
  start?: string;
  end?: string;
  step?: number;
  scope?: QueryScope;
};

export type LogReference = {
  query: string;
  start?: string;
  end?: string;
  scope?: QueryScope;
};

export type CopilotReferences = {
  incidents?: string[];
  services?: string[];
  metrics?: MetricReference[];
  logs?: LogReference[];
  tickets?: string[];
};

export type CopilotAnswer = {
  conclusion: string;
  evidence?: string[];
  missing?: string[];
  actions?: { label: string; type: string; payload?: unknown }[];
  references?: CopilotReferences;
  links?: CopilotLink[];
  data?: unknown;
  confidence?: number;
  chatId?: string;
};

export type ChatConversation = {
  chatId: string;
  name: string;
  createdAt: number;
  lastAccessedAt: number;
  turnCount: number;
};

export type ChatSearchResult = {
  chatId: string;
  name: string;
  createdAt: number;
  lastAccessedAt: number;
  turnCount: number;
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
