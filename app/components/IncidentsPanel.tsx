import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncState } from "@/app/lib/hooks";
import { requestJSON } from "@/app/lib/api";
import { formatDate } from "@/app/lib/utils";
import { Incident } from "@/app/lib/types";
import { Field, Pill, Section, Select, TextInput } from "@/app/lib/ui";

const incidentStatusOptions = [
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "mitigated", label: "Mitigated" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const incidentSeverityOptions = [
  { value: "sev1", label: "Sev1 - Critical" },
  { value: "sev2", label: "Sev2 - High" },
  { value: "sev3", label: "Sev3 - Medium" },
  { value: "sev4", label: "Sev4 - Low" },
];

export function IncidentsPanel() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentForm, setIncidentForm] = useState({ title: "", status: "open", severity: "sev3" });
  const incidentState = useAsyncState();

  const loadIncidents = async () => {
    incidentState.start();
    try {
      const data = await requestJSON<Incident[]>("/incidents");
      setIncidents(data);
      incidentState.succeed();
    } catch (err) {
      incidentState.fail(err);
    }
  };

  const createIncident = async () => {
    const body = JSON.stringify({
      title: incidentForm.title,
      status: incidentForm.status,
      severity: incidentForm.severity,
    });
    incidentState.start();
    try {
      const inc = await requestJSON<Incident>("/incidents", {
        method: "POST",
        body,
      });
      setIncidents((prev) => [inc, ...prev]);
      setIncidentForm({ title: "", status: "open", severity: "sev3" });
      incidentState.succeed();
    } catch (err) {
      incidentState.fail(err);
    }
  };

  return (
    <Section
      title="Incidents"
      description="Create incidents, browse the list, and hop into detailed timelines."
      action={
        <button
          type="button"
          onClick={loadIncidents}
          className="rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-medium text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0] hover:text-[#0b1517]"
        >
          Refresh
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Title"
          input={
            <TextInput
              value={incidentForm.title}
              onChange={(v) => setIncidentForm((f) => ({ ...f, title: v }))}
              placeholder="Paging latency spike"
            />
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Status"
            input={
              <Select
                value={incidentForm.status}
                onChange={(v) => setIncidentForm((f) => ({ ...f, status: v }))}
                options={incidentStatusOptions}
              />
            }
          />
          <Field
            label="Severity"
            input={
              <Select
                value={incidentForm.severity}
                onChange={(v) => setIncidentForm((f) => ({ ...f, severity: v }))}
                options={incidentSeverityOptions}
              />
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={createIncident}
          disabled={!incidentForm.title || incidentState.loading}
          className="rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8] disabled:cursor-not-allowed disabled:bg-[#b7eded]"
        >
          {incidentState.loading ? "Saving..." : "Create incident"}
        </button>
        {incidentState.error ? <Pill label={incidentState.error} tone="error" /> : null}
      </div>

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-slate-700">Incident list</p>
          <span className="text-xs text-slate-500">(select to view details)</span>
        </div>
        <div className="flex max-h-60 flex-col gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
          {incidents.length === 0 ? (
            <p className="text-xs text-slate-500">No incidents loaded yet.</p>
          ) : (
            incidents.map((inc) => (
              <button
                key={inc.id}
                type="button"
                onClick={() => router.push(`/incidents/${inc.id}`)}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition hover:border-[#55cfd0] hover:bg-white ${
                  "border-slate-200 bg-white/70"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">{inc.title}</span>
                  <span className="text-xs text-slate-500">Updated {formatDate(inc.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Pill label={inc.status} tone={inc.status === "open" ? "warn" : "default"} />
                  <Pill label={inc.severity} tone={inc.severity === "sev1" ? "error" : "default"} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

    </Section>
  );
}
