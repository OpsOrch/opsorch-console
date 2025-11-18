import { useMemo, useState } from "react";
import { getApiBaseUrl, trimTrailingSlash } from "@/app/lib/api";
import { Section, Field, Pill } from "@/app/lib/ui";

function useHealth() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const check = async () => {
    setStatus("idle");
    setMessage("Checking...");
    try {
      const res = await fetch("/api/proxy/health", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { status?: string };
      if (data.status === "ok") {
        setStatus("ok");
        setMessage("Healthy");
      } else {
        setStatus("error");
        setMessage("Unexpected response");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  };

  return { status, message, check };
}

export function SettingsPanel() {
  const baseUrl = useMemo(() => trimTrailingSlash(getApiBaseUrl()), []);
  const displayBaseUrl = baseUrl || "Configured via server proxy env";
  const health = useHealth();

  return (
    <Section
      title="Settings (admin)"
      description="Base URL comes from environment configuration."
    >
      <Field
        label="OpsOrch API base URL"
        input={
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
            {displayBaseUrl}
          </div>
        }
      />
      <p className="text-xs text-slate-600">
        Requests now proxy through the app backend using server env vars (e.g. `OPS_ORCH_API_BASE_URL` and `OPS_ORCH_API_TOKEN`). Optional `NEXT_PUBLIC_*` vars only affect what is displayed here.
      </p>
      <div className="flex items-center gap-3 text-sm">
        <Pill
          label={
            health.status === "ok"
              ? `API healthy via proxy${baseUrl ? ` (${trimTrailingSlash(baseUrl)})` : ""}`
              : health.status === "error"
                ? `Unhealthy: ${health.message}`
                : "Check API health"
          }
          tone={health.status === "ok" ? "success" : health.status === "error" ? "error" : "warn"}
        />
        <button
          type="button"
          onClick={health.check}
          className="rounded-lg border border-[#8fdede] bg-[#e7f8f8] px-3 py-2 text-xs font-medium text-[#0f1a1d] transition hover:border-[#55cfd0] hover:bg-white"
        >
          Re-check
        </button>
      </div>
    </Section>
  );
}
