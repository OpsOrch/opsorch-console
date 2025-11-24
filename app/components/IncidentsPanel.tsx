import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncState } from "@/app/lib/hooks";
import { requestJSON } from "@/app/lib/api";
import { formatDate } from "@/app/lib/utils";
import { Incident } from "@/app/lib/types";
import { Badge, Section } from "@/app/lib/ui";
import { IncidentCreateModal } from "./IncidentCreateModal";



export function IncidentsPanel() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  // const [incidentForm, setIncidentForm] = useState({ title: "", status: "open", severity: "sev3", service: "" }); // Removed
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const incidentState = useAsyncState();

  const loadIncidents = async () => {
    incidentState.start();
    try {
      const data = await requestJSON<Incident[]>("/incidents/query", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setIncidents(data);
      incidentState.succeed();
    } catch (err) {
      incidentState.fail(err);
    }
  };

  const createIncident = async (form: { title: string; status: string; severity: string; service: string }) => {
    const body = JSON.stringify({
      title: form.title,
      status: form.status,
      severity: form.severity,
      service: form.service || undefined,
    });
    incidentState.start();
    try {
      const inc = await requestJSON<Incident>("/incidents", {
        method: "POST",
        body,
      });
      setIncidents((prev) => [inc, ...prev]);
      setIsCreateModalOpen(false);
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
          >
            Create Incident
          </button>
          <button
            type="button"
            onClick={loadIncidents}
            className="rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-medium text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0] hover:text-[#0b1517]"
          >
            Refresh
          </button>
        </div>
      }
    >
      <IncidentCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createIncident}
        loading={incidentState.loading}
        error={incidentState.error}
      />

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-slate-700">Incident list</p>
          <span className="text-xs text-slate-500">(select to view details)</span>
        </div>
        <div className="flex max-h-60 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
          {incidentState.loading && incidents.length === 0 ? (
            <div className="animate-fade-in space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white/80 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-48 rounded bg-slate-200" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 rounded-full bg-slate-200" />
                      <div className="h-6 w-12 rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="mt-2 h-3 w-32 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="animate-fade-in rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
                <svg className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">No incidents loaded</p>
              <p className="mt-1 text-xs text-slate-500">Click Refresh to load incidents</p>
            </div>
          ) : (
            incidents.map((inc) => {
              const severityColors = {
                sev1: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-500" },
                sev2: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-500" },
                sev3: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500" },
                sev4: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500" },
              };
              const colors = severityColors[inc.severity as keyof typeof severityColors] || severityColors.sev3;

              return (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => router.push(`/incidents/${inc.id}`)}
                  className="animate-fade-in group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[#55cfd0] hover:shadow-md"
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colors.bg}`}>
                    <svg className={`h-5 w-5 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 group-hover:text-[#0f5f66]">{inc.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Updated {formatDate(inc.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      label={inc.status}
                      variant={inc.status === "open" ? "warning" : "default"}
                      size="sm"
                    />
                    <Badge
                      label={inc.severity}
                      variant={inc.severity === "sev1" ? "error" : inc.severity === "sev2" ? "warning" : "default"}
                      size="sm"
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

    </Section>
  );
}
