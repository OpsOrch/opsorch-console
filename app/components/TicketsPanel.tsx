import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState } from "@/app/lib/hooks";
import { Ticket } from "@/app/lib/types";
import { formatDate, stringify } from "@/app/lib/utils";
import { Field, Pill, Section, Select, TextArea, TextInput } from "@/app/lib/ui";

type TicketsPanelProps = {
  initialTicketId?: string;
};

export function TicketsPanel({ initialTicketId }: TicketsPanelProps = {}) {
  const router = useRouter();
  const ticketState = useAsyncState();
  const [ticketForm, setTicketForm] = useState({ title: "", description: "" });
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState("resolved");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchStatuses, setSearchStatuses] = useState("");
  const [searchAssignee, setSearchAssignee] = useState("");
  const [searchReporter, setSearchReporter] = useState("");
  const [searchLimit, setSearchLimit] = useState("25");
  const { start: startTicketAction, succeed: finishTicketAction, fail: failTicketAction } = ticketState;

  const ticketStatusOptions = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const createTicket = async () => {
    ticketState.start();
    try {
      const res = await requestJSON<Ticket>("/tickets", {
        method: "POST",
        body: JSON.stringify(ticketForm),
      });
      setTickets((prev) => [res, ...prev]);
      setSelectedTicket(res);
      setTicketForm({ title: "", description: "" });
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

  return (
    <Section
      id="tickets-panel"
      title="Tickets"
      description="Create tickets and query by keyword, status, reporter, or assignee."
    >
      <div className="grid gap-3">
        <Field
          label="Title"
          input={
            <TextInput
              value={ticketForm.title}
              onChange={(v) => setTicketForm((f) => ({ ...f, title: v }))}
              placeholder="Customer-facing issue"
            />
          }
        />
        <Field
          label="Description"
          input={
            <TextArea
              value={ticketForm.description}
              onChange={(v) => setTicketForm((f) => ({ ...f, description: v }))}
              placeholder="What is happening and what should be done"
            />
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={createTicket}
            disabled={!ticketForm.title || ticketState.loading}
            className="rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8] disabled:cursor-not-allowed disabled:bg-[#b7eded]"
          >
            {ticketState.loading ? "Saving..." : "Create ticket"}
          </button>
          {ticketState.error ? <Pill label={ticketState.error} tone="error" /> : null}
        </div>
      </div>
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
        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
          {tickets.length === 0 ? (
            <p className="text-xs text-slate-500">No matching tickets.</p>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTicket(t)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition hover:border-[#55cfd0] hover:bg-white ${
                  selectedTicket?.id === t.id ? "border-[#55cfd0] bg-white" : "border-slate-200 bg-white/70"
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-600">{t.id}</p>
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
            <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2 text-[11px] text-slate-700">{stringify(activeTicket.metadata)}</pre>
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
