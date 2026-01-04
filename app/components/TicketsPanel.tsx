import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState, useIntegrations } from "@/app/lib/hooks";
import { Ticket, QueryScope } from "@/app/lib/types";
import { formatDate, stringify } from "@/app/lib/utils";
import { DEFAULT_QUERY_LIMIT } from "@/app/lib/consts";
import { CodeBlock, Field, Pill, Section, Select, TextInput } from "@/app/lib/ui";
import { TicketCreateModal } from "./TicketCreateModal";
import { EmptyState } from "@/app/components/EmptyState";

type TicketsPanelProps = {
  initialTicketId?: string;
  readOnly?: boolean;
  initialScope?: QueryScope;
};

export function TicketsPanel({ initialTicketId, readOnly = false, initialScope }: TicketsPanelProps = {}) {
  const router = useRouter();
  const ticketState = useAsyncState();
  const { hasIntegrations, loading: integrationsLoading } = useIntegrations();
  // const [ticketForm, setTicketForm] = useState({ title: "", description: "", assignees: "", reporter: "" }); // Removed
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState("resolved");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchStatuses, setSearchStatuses] = useState("");
  const [searchAssignee, setSearchAssignee] = useState("");
  const [searchReporter, setSearchReporter] = useState("");
  const [searchLimit, setSearchLimit] = useState(String(DEFAULT_QUERY_LIMIT));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { start: startTicketAction, succeed: finishTicketAction, fail: failTicketAction } = ticketState;

  const ticketStatusOptions = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const createTicket = async (form: { title: string; description: string; assignees: string; reporter: string }) => {
    ticketState.start();
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
      };
      if (form.assignees) {
        payload.assignees = form.assignees.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (form.reporter) {
        payload.reporter = form.reporter;
      }
      const res = await requestJSON<Ticket>("/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTickets((prev) => [res, ...prev]);
      setSelectedTicket(res);
      setIsCreateModalOpen(false);
      ticketState.succeed();
    } catch (err) {
      ticketState.fail(err);
    }
  };

  const updateTicket = async () => {
    if (!selectedTicket) return;
    const allowed = ticketStatusOptions.map((s) => s.value);
    if (!allowed.includes(ticketStatusUpdate)) {
      ticketState.fail(new Error("Select a valid status"));
      return;
    }
    ticketState.start();
    try {
      const res = await requestJSON<Ticket>(`/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: ticketStatusUpdate }),
      });
      setSelectedTicket(res);
      setTickets((prev) => [res, ...prev.filter((t) => t.id !== res.id)]);
      ticketState.succeed();
    } catch (err) {
      ticketState.fail(err);
    }
  };

  const activeTicket = selectedTicket && tickets.find((t) => t.id === selectedTicket.id)
    ? selectedTicket
    : tickets[0] || null;

  const runSearch = async () => {
    ticketState.start();
    try {
      const body: Record<string, unknown> = {};
      const statuses = searchStatuses
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const limitNum = Number(searchLimit);
      if (statuses.length) body.statuses = statuses;
      if (searchAssignee.trim()) body.assignees = [searchAssignee.trim()];
      if (searchReporter.trim()) body.reporter = searchReporter.trim();
      if (searchText.trim()) {
        body.query = searchText.trim();
      }
      if (!Number.isNaN(limitNum) && limitNum > 0) body.limit = limitNum;

      // Add scope if provided
      if (initialScope) {
        body.scope = initialScope;
      }

      const res = await requestJSON<Ticket[]>("/tickets/query", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setTickets(res);
      setSelectedTicket(res[0] || null);
      ticketState.succeed();
    } catch (err) {
      ticketState.fail(err);
    }
  };

  const loadTicketFromReference = useCallback(async (ticketId: string) => {
    if (!ticketId) return;
    startTicketAction();
    try {
      const res = await requestJSON<Ticket>(`/tickets/${ticketId}`);
      setTickets((prev) => [res, ...prev.filter((t) => t.id !== res.id)]);
      setSelectedTicket(res);
      finishTicketAction();
    } catch (err) {
      failTicketAction(err);
    }
  }, [failTicketAction, finishTicketAction, setSelectedTicket, setTickets, startTicketAction]);

  useEffect(() => {
    if (!initialTicketId) return;
    void loadTicketFromReference(initialTicketId);
  }, [initialTicketId, loadTicketFromReference]);

  const resetToDefaults = () => {
    setSearchText("");
    setSearchStatuses("");
    setSearchAssignee("");
    setSearchReporter("");
    setSearchLimit(String(DEFAULT_QUERY_LIMIT));
    // trigger a search with default values
    ticketState.start();
    const body = { limit: DEFAULT_QUERY_LIMIT };
    requestJSON<Ticket[]>("/tickets/query", {
      method: "POST",
      body: JSON.stringify(body),
    }).then(res => {
      setTickets(res);
      setSelectedTicket(res[0] || null);
      ticketState.succeed();
    }).catch(err => ticketState.fail(err));
  };

  const isDefaultQuery = () => {
    return (
      !searchText &&
      !searchStatuses &&
      !searchAssignee &&
      !searchReporter &&
      searchLimit === String(DEFAULT_QUERY_LIMIT)
    );
  };

  // Auto-run search on mount
  useEffect(() => {
    // initialScope is available in scope of runSearch via closure if we use it directly,
    // or we can just rely on the fact that runSearch uses state which is initialized.
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <Section
      id="tickets-panel"
      title="Tickets"
      description="Create tickets and query by keyword, status, reporter, or assignee."
      action={
        !readOnly ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
          >
            Create Ticket
          </button>
        ) : null
      }
    >
      <TicketCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createTicket}
        loading={ticketState.loading}
        error={ticketState.error}
      />

      {!readOnly && (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">
          <div className="grid grid-cols-[2fr_auto] items-end gap-2">
            <Field
              label="Search tickets (title or description)"
              input={
                <TextInput
                  value={searchText}
                  onChange={setSearchText}
                  placeholder="login error, outage, customer request"
                />
              }
            />
            <div className="flex gap-2">
              {!readOnly && !isDefaultQuery() && (
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="h-fit rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={runSearch}
                className="h-fit rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-semibold text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0] hover:text-[#0b1517]"
              >
                Search
              </button>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Field
              label="Statuses"
              input={<TextInput value={searchStatuses} onChange={setSearchStatuses} placeholder="open, acknowledged" />}
            />
            <Field
              label="Assignee"
              input={<TextInput value={searchAssignee} onChange={setSearchAssignee} placeholder="alice" />}
            />
            <Field
              label="Reporter"
              input={<TextInput value={searchReporter} onChange={setSearchReporter} placeholder="bob" />}
            />
          </div>
          <Field
            label="Limit"
            input={<TextInput value={searchLimit} onChange={setSearchLimit} type="number" placeholder="20" />}
          />
        </div>
      )}

      <div className={readOnly ? "grid gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm" : "grid gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm"}>
        <div className="flex flex-col gap-2 max-h-52 xl:max-h-[24rem] 2xl:max-h-[32rem] overflow-y-auto">
          {ticketState.error ? (
            <EmptyState
              title="Error loading tickets"
              description={ticketState.error}
              variant="error"
              action={{ label: "Retry", onClick: runSearch }}
            />
          ) : (ticketState.loading || integrationsLoading) && tickets.length === 0 ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-5 w-16 rounded-full bg-slate-200" />
                  </div>
                  <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
                </div>
              ))}
            </>
          ) : !hasIntegrations ? (
            <EmptyState
              title="No integration configured"
              description="Connect an integration to manage tickets."
              variant="no-integration"
              action={{ label: "Configure Integration", onClick: () => router.push("/settings") }}
            />
          ) : tickets.length === 0 ? (
            <EmptyState
              title={readOnly ? "No tickets" : isDefaultQuery() ? "No tickets found" : "No matching tickets"}
              description={readOnly ? "No tickets to display." : isDefaultQuery() ? "There are no tickets in the system currently." : "Try adjusting your search filters or resetting to default."}
              variant={readOnly ? "default" : "no-data"}
              action={!readOnly && !isDefaultQuery() ? { label: "Reset to Default", onClick: resetToDefaults } : { label: "Refresh", onClick: runSearch }}
            />
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => router.push(`/tickets/${t.id}`)}
                className="animate-fade-in flex items-center gap-3 justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-all hover:border-[#55cfd0] hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${selectedTicket?.id === t.id ? "bg-purple-100" : "bg-slate-100"
                    }`}>
                    <svg className={`h-4 w-4 ${selectedTicket?.id === t.id ? "text-purple-600" : "text-slate-500"
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.title}</p>
                    <p className="text-xs text-slate-600">{t.id}</p>
                  </div>
                </div>
                <Pill label={t.status} />
              </button>
            ))
          )}
        </div>
      </div>

      {activeTicket ? (
        <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket</p>
              <h3 className="text-base font-semibold text-slate-900">{activeTicket.title}</h3>
              <p className="text-xs text-slate-500">{activeTicket.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/tickets/${activeTicket.id}`)}
                className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 text-xs font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
              >
                Open detail
              </button>
              {activeTicket.key ? <Pill label={activeTicket.key} /> : null}
              <Pill label={activeTicket.status} />
            </div>
          </div>
          <p className="mt-2 text-slate-700">{activeTicket.description || "No description"}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <span>Created: {formatDate(activeTicket.createdAt)}</span>
            <span>Updated: {formatDate(activeTicket.updatedAt)}</span>
          </div>
          {stringify(activeTicket.metadata) ? (
            <div className="mt-2">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</p>
              <CodeBlock code={stringify(activeTicket.metadata) || ""} language="json" />
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-[2fr_1fr] gap-3 items-end">
            <Field
              label="Update status"
              input={
                <Select
                  value={ticketStatusUpdate}
                  onChange={setTicketStatusUpdate}
                  options={ticketStatusOptions}
                />
              }
            />
            <button
              type="button"
              onClick={updateTicket}
              className="rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
            >
              Update status
            </button>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
