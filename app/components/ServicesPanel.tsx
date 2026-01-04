import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState } from "@/app/lib/hooks";
import { Service } from "@/app/lib/types";
import { Badge, Field, Pill, Section, TextInput } from "@/app/lib/ui";
import { EmptyState } from "@/app/components/EmptyState";

type ServicesPanelProps = {
  initialName?: string;
};

export function ServicesPanel({ initialName }: ServicesPanelProps = {}) {
  const router = useRouter();
  const serviceState = useAsyncState();
  const [serviceName, setServiceName] = useState(initialName || "");
  const [services, setServices] = useState<Service[]>([]);

  const runSearch = async () => {
    serviceState.start();
    try {
      const res = await requestJSON<Service[]>("/services/query", {
        method: "POST",
        body: JSON.stringify({ name: serviceName }),
      });
      setServices(res);
      serviceState.succeed();
    } catch (err) {
      serviceState.fail(err);
    }
  };

  // Auto-run search on mount
  useEffect(() => {
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetToDefaults = () => {
    setServiceName("");
    requestAnimationFrame(() => {
      serviceState.start();
      requestJSON<Service[]>("/services")
        .then(res => {
          setServices(res);
          serviceState.succeed();
        })
        .catch(err => serviceState.fail(err));
    });
  };

  const isDefaultQuery = () => !serviceName;

  return (
    <Section
      title="Services"
      action={
        <div className="flex gap-2">
          {!isDefaultQuery() && (
            <button
              type="button"
              onClick={resetToDefaults}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={runSearch}
            className="rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
          >
            Search
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <Field
          label="Name contains"
          input={
            <TextInput
              value={serviceName}
              onChange={setServiceName}
              placeholder="api"
            />
          }
        />
      </div>
      {serviceState.error ? <Pill label={serviceState.error} tone="error" /> : null}
      <div className="grid max-h-72 xl:max-h-[30rem] 2xl:max-h-[40rem] gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        {serviceState.error ? (
          <EmptyState
            title="Error loading services"
            description={serviceState.error}
            variant="error"
            action={{ label: "Retry", onClick: runSearch }}
          />
        ) : serviceState.loading && services.length === 0 ? (
          <>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white/80 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 rounded bg-slate-200" />
                  <div className="h-6 w-20 rounded-full bg-slate-200" />
                </div>
                <div className="mt-2 h-3 w-48 rounded bg-slate-200" />
              </div>
            ))}
          </>
        ) : services.length === 0 ? (
          <EmptyState
            title={isDefaultQuery() ? "No services found" : "No matching services"}
            description={isDefaultQuery() ? "There are no services in the system." : "Try adjusting your search criteria or resetting to default."}
            variant="no-data"
            action={!isDefaultQuery() ? { label: "Reset to Default", onClick: resetToDefaults } : { label: "Refresh", onClick: runSearch }}
          />
        ) : (
          services.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => router.push(`/services/${svc.id}`)}
              className="animate-fade-in group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[#55cfd0] hover:shadow-md"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-[#0f5f66]">{svc.name}</p>
                {svc.tags ? (
                  <p className="mt-0.5 text-xs text-slate-600">
                    {Object.entries(svc.tags).map(([k, v]) => `${k}=${v}`).join(", ")}
                  </p>
                ) : null}
              </div>
              <Badge label={svc.id} variant="default" size="sm" />
            </button>
          ))
        )}
      </div>
    </Section>
  );
}
