"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { requestJSON } from "@/app/lib/api";
import { queryIncidents } from "@/app/lib/incidents";
import { buildScopeFromTicket } from "@/app/lib/scope";
import { fetchTicket } from "@/app/lib/tickets";
import { Incident, Ticket } from "@/app/lib/types";
import { Field, Pill, Select } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";

const tabOrder = [
  { key: "incidents", label: "Incidents" },
] as const;

const ticketStatusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

type TabKey = (typeof tabOrder)[number]["key"];

type LoadingMap = Record<string, boolean>;
type ErrorMap = Record<string, string>;

const isNotFound = (err: unknown) => err instanceof Error && /404|not found/i.test(err.message);



const formatJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};





export default function TicketDetailPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const ticketId = useMemo(() => {
    const raw = params?.id as string;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const [activeTab, setActiveTab] = useState<TabKey>("incidents");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<LoadingMap>({});
  const [errors, setErrors] = useState<ErrorMap>({});

  const scope = useMemo(() => buildScopeFromTicket(ticket), [ticket]);

  const withState = async (key: string, fn: () => Promise<void>) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      await fn();
    } catch (err) {
      setErrors((prev) => ({ ...prev, [key]: err instanceof Error ? err.message : String(err) }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    await withState("ticket", async () => {
      const res = await fetchTicket(ticketId);
      setTicket(res);
      setStatusUpdate(res.status);
    });
  }, [ticketId]);

  const loadIncidents = useCallback(async () => {
    if (!ticketId) return;
    await withState("incidents", async () => {
      try {
        const res = await queryIncidents(Object.keys(scope).length ? { scope } : undefined);
        setIncidents(res as Incident[]);
      } catch (err) {
        if (isNotFound(err)) {
          // If the ticket is not found, we just set incidents to empty
          setIncidents([]);
        } else {
          throw err;
        }
      }
    });
  }, [scope, ticketId]);



  const updateStatus = async () => {
    if (!ticketId || !statusUpdate) return;
    const allowed = ticketStatusOptions.map((s) => s.value);
    if (!allowed.includes(statusUpdate)) {
      setErrors((prev) => ({ ...prev, status: "Select a valid status" }));
      return;
    }
    await withState("status", async () => {
      const res = await requestJSON<Ticket>(`/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusUpdate }),
      });
      setTicket(res);
      setStatusUpdate(res.status);
    });
  };

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (activeTab === "incidents") loadIncidents();
  }, [activeTab, loadIncidents]);

  const hero = ticket ? (
    <div className="flex items-center gap-3">
      <Pill label={ticket.status} tone={ticket.status === "open" ? "warn" : "default"} />
      {ticket.key ? <Pill label={ticket.key} /> : null}
      <span className="text-xs uppercase tracking-[0.2em] text-[#3d8f92]">{ticket.id}</span>
    </div>
  ) : (
    "Ticket"
  );

  return (
    <AppShell
      title={ticket?.title || "Ticket detail"}
      description="Status, metadata, and related signals for this ticket."
      hero={hero}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Link href="/tickets" className="text-xs font-semibold text-[#0b1517] underline-offset-4 hover:underline">
            Back to all tickets
          </Link>
          {ticket?.reporter ? <Pill label={`reported by ${ticket.reporter}`} /> : null}
          {ticket?.assignees?.length ? <Pill label={`${ticket.assignees.length} assignees`} /> : null}
          {ticket?.url ? (
            <a
              href={ticket.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[#8fdede] bg-white px-2 py-1 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:text-[#0b1517]"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View ticket
            </a>
          ) : null}
          {errors.ticket ? <Pill label={errors.ticket} tone="error" /> : null}
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {ticket ? (
              <>
                <span>Created {formatDate(ticket.createdAt)}</span>
                <span>Updated {formatDate(ticket.updatedAt)}</span>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                loadTicket();
                if (activeTab === "incidents") loadIncidents();
              }}
              className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <Pill label={ticket?.status || "loading"} tone={ticket?.status === "open" ? "warn" : "default"} />
            {ticket?.key ? <Pill label={ticket.key} /> : null}
            {ticket?.assignees?.length ? <span className="text-xs text-slate-600">Assignees: {ticket.assignees.join(", ")}</span> : null}
            {ticket?.reporter ? <span className="text-xs text-slate-600">Reporter: {ticket.reporter}</span> : null}
            {errors.status ? <Pill label={errors.status} tone="error" /> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr] sm:items-end">
            <Field
              label="Update status"
              input={
                <Select
                  value={statusUpdate}
                  onChange={setStatusUpdate}
                  options={ticketStatusOptions}
                />
              }
            />
            <button
              type="button"
              onClick={updateStatus}
              className="h-fit rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
              disabled={!statusUpdate || loading.status}
            >
              {loading.status ? "Saving..." : "Save status"}
            </button>
          </div>
          {ticket?.description ? <p className="text-slate-700">{ticket.description}</p> : <p className="text-slate-500">No description provided.</p>}
          <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700 sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Service</p>
              <p className="text-sm font-semibold text-slate-900">{scope.service || "unknown"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Environment</p>
              <p className="text-sm font-semibold text-slate-900">{scope.environment || "unknown"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Team</p>
              <p className="text-sm font-semibold text-slate-900">{scope.team || "unknown"}</p>
            </div>
          </div>
          {ticket?.fields ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Fields</p>
              <pre className="overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">{formatJson(ticket.fields)}</pre>
            </div>
          ) : null}
          {ticket?.metadata ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Metadata</p>
              <pre className="overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">{formatJson(ticket.metadata)}</pre>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2">
          {tabOrder.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab.key ? "bg-[#55cfd0] text-[#0b1517] shadow" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "incidents" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Incidents linked to this ticket</h2>
              {errors.incidents ? <Pill label={errors.incidents} tone="error" /> : null}
            </div>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {incidents.length === 0 ? (
                <p className="text-slate-500">No incidents fetched yet.</p>
              ) : (
                incidents.map((inc) => (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => router.push(`/incidents/${inc.id}`)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-[#55cfd0] hover:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{inc.title}</p>
                        <p className="text-xs text-slate-600">{inc.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill label={inc.status} tone={inc.status === "open" ? "warn" : "default"} />
                        <Pill label={inc.severity} tone={inc.severity === "sev1" ? "error" : "default"} />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">Updated {formatDate(inc.updatedAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
