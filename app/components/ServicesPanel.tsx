import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState } from "@/app/lib/hooks";
import { Service } from "@/app/lib/types";
import { Pill, Section, TextInput, Field } from "@/app/lib/ui";

export function ServicesPanel() {
  const router = useRouter();
  const serviceState = useAsyncState();
  const [serviceName, setServiceName] = useState("api");
  const [services, setServices] = useState<Service[]>([]);

  const listServices = async () => {
    serviceState.start();
    try {
      const res = await requestJSON<Service[]>("/services");
      setServices(res);
      serviceState.succeed();
    } catch (err) {
      serviceState.fail(err);
    }
  };

  const queryServices = async () => {
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

  return (
    <Section
      title="Services"
      description="Look up services available from the connected source."
      action={
        <button
          type="button"
          onClick={listServices}
          className="rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-medium text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0] hover:text-[#0b1517]"
        >
          Refresh
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={queryServices}
            className="rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={listServices}
            className="rounded-lg border border-[#8fdede] bg-white px-3 py-2 text-xs font-semibold text-[#0f1a1d] shadow-sm transition hover:border-[#55cfd0] hover:text-[#0b1517]"
          >
            List all
          </button>
        </div>
      </div>
      {serviceState.error ? <Pill label={serviceState.error} tone="error" /> : null}
      <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
        {services.length === 0 ? (
          <p className="text-slate-500">No services fetched yet.</p>
        ) : (
          services.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => router.push(`/services/${svc.id}`)}
              className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-left transition hover:border-[#55cfd0] hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{svc.name}</p>
                <Pill label={svc.id} />
              </div>
              {svc.tags ? (
                <p className="text-xs text-slate-600">Tags: {Object.entries(svc.tags).map(([k, v]) => `${k}=${v}`).join(", ")}</p>
              ) : null}
            </button>
          ))
        )}
      </div>
    </Section>
  );
}
