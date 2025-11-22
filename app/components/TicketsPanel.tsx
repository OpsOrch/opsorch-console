import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState } from "@/app/lib/hooks";
import { Ticket, QueryScope } from "@/app/lib/types";
import { formatDate, stringify } from "@/app/lib/utils";
import { CodeBlock, Field, Pill, Section, Select, TextArea, TextInput } from "@/app/lib/ui";
import { TicketCreateModal } from "./TicketCreateModal";

type TicketsPanelProps = {
  initialTicketId?: string;
  readOnly?: boolean;
  initialScope?: QueryScope;
};

export function TicketsPanel({ initialTicketId, readOnly = false, initialScope }: TicketsPanelProps = {}) {
  const router = useRouter();
  const ticketState = useAsyncState();
  // const [ticketForm, setTicketForm] = useState({ title: "", description: "", assignees: "", reporter: "" }); // Removed
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState("resolved");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchStatuses, setSearchStatuses] = useState("");
  const [searchAssignee, setSearchAssignee] = useState("");
  const [searchReporter, setSearchReporter] = useState("");
  const [searchLimit, setSearchLimit] = useState("25");
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
    const frame = requestAnimationFrame(() => {
      loadTicketFromReference(initialTicketId);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialTicketId, loadTicketFromReference]);

  // Auto-run search in readOnly mode
  useEffect(() => {
    if (!readOnly || !initialScope) return;
    const frame = requestAnimationFrame(() => {
      void runSearch();
    });
    return () => cancelAnimationFrame(frame);
  }, [readOnly, initialScope]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <button
            type="button"
            onClick={runSearch}
            className="h-fit rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-semibold text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0] hover:text-[#0b1517]"
          >
            Search
          </button>
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
          input={<TextInput value={searchLimit} onChange={setSearchLimit} type="number" placeholder="25" />}
        />
      </div>

      <div className={readOnly ? "grid gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm" : "grid gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm"}>
        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
          {ticketState.loading && tickets.length === 0 ? (
            <div className="animate-fade-in space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-5 w-16 rounded-full bg-slate-200" />
                  </div>
                  <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="animate-fade-in rounded-lg border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
                <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-700">No tickets found</p>
              <p className="mt-0.5 text-xs text-slate-500">Try searching or create a new ticket</p>
            </div>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTicket(t)}
                className={`animate-fade-in flex items-center gap-3 justify-between rounded-lg border px-3 py-2 text-left shadow-sm transition-all hover:border-[#55cfd0] hover:shadow-md ${selectedTicket?.id === t.id ? "border-[#55cfd0] bg-purple-50 shadow-md" : "border-slate-200 bg-white"
                  }`}
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
