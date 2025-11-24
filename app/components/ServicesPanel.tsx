import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState } from "@/app/lib/hooks";
import { Service } from "@/app/lib/types";
import { Badge, Field, Pill, Section, TextInput } from "@/app/lib/ui";

type ServicesPanelProps = {
  initialName?: string;
};

export function ServicesPanel({ initialName }: ServicesPanelProps = {}) {
  const router = useRouter();
  const serviceState = useAsyncState();
  const [serviceName, setServiceName] = useState(initialName || "api");
  const [services, setServices] = useState<Service[]>([]);

  const runSearch = async () => {
    serviceState.start();
    try {
      if (!serviceName.trim()) {
        const res = await requestJSON<Service[]>("/services");
        setServices(res);
      } else {
        const res = await requestJSON<Service[]>("/services/query", {
          method: "POST",
          body: JSON.stringify({ name: serviceName }),
        });
        setServices(res);
      }
      serviceState.succeed();
    } catch (err) {
      serviceState.fail(err);
    }
  };

  // Auto-run search if initialName is provided
  useEffect(() => {
    if (initialName) {
      runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialName]);

  return (
    <Section
      title="Services"
      action={
        <button
          type="button"
          onClick={runSearch}
          className="rounded-lg bg-[#55cfd0] px-3 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
        >
          Search
        </button>
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
      <div className="grid max-h-72 gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        {serviceState.loading && services.length === 0 ? (
          <div className="animate-fade-in space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white/80 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 rounded bg-slate-200" />
                  <div className="h-6 w-20 rounded-full bg-slate-200" />
                </div>
                <div className="mt-2 h-3 w-48 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="animate-fade-in rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">No services found</p>
            <p className="mt-1 text-xs text-slate-500">Click &quot;List all&quot; to fetch services</p>
          </div>
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
