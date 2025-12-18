"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { LogsPanel } from "@/app/components/LogsPanel";
import { MetricsPanel } from "@/app/components/MetricsPanel";
import { TicketsPanel } from "@/app/components/TicketsPanel";
import { AlertsPanel } from "@/app/components/AlertsPanel";
import { getTeam, getTeamMembers } from "@/app/lib/teams";
import { queryIncidents } from "@/app/lib/incidents";
import { Team, TeamMember, Incident } from "@/app/lib/types";
import { Pill } from "@/app/lib/ui";
import { formatDate } from "@/app/lib/utils";

const tabOrder = [
  { key: "members", label: "Members" },
  { key: "services", label: "Services" },
  { key: "incidents", label: "Incidents" },
  { key: "alerts", label: "Alerts" },
  { key: "logs", label: "Logs" },
  { key: "metrics", label: "Metrics" },
  { key: "tickets", label: "Tickets" },
] as const;

type TabKey = (typeof tabOrder)[number]["key"];

type ErrorMap = Record<string, string>;

const formatJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function TeamDetailPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const teamId = useMemo(() => {
    const raw = params?.id as string;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const [activeTab, setActiveTab] = useState<TabKey>("members");
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [errors, setErrors] = useState<ErrorMap>({});



  const withState = async (key: string, fn: () => Promise<void>) => {
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      await fn();
    } catch (err) {
      setErrors((prev) => ({ ...prev, [key]: err instanceof Error ? err.message : String(err) }));
    }
  };

  const loadTeam = useCallback(async () => {
    if (!teamId) return;
    await withState("team", async () => {
      const res = await getTeam(teamId);
      setTeam(res);
    });
  }, [teamId]);

  const loadMembers = useCallback(async () => {
    if (!teamId) return;
    await withState("members", async () => {
      const res = await getTeamMembers(teamId);
      setMembers(res);
    });
  }, [teamId]);

  const loadIncidents = useCallback(async () => {
    if (!teamId || !team?.id) return;
    await withState("incidents", async () => {
      const scopePayload: { team: string; service?: string } = { team: team.id };
      const services = team?.metadata?.services as string[];
      if (services && services.length > 0) {
        scopePayload.service = services[0];
      }
      const queried = await queryIncidents({ scope: scopePayload });
      setIncidents(queried as Incident[]);
    });
  }, [teamId, team?.id, team?.metadata?.services]);

  // Load team and members first
  useEffect(() => {
    loadTeam();
    loadMembers();
  }, [loadTeam, loadMembers]);

  // Load incidents only after team is loaded
  useEffect(() => {
    if (team?.id) {
      loadIncidents();
    }
  }, [team?.id, loadIncidents]);

  const getTeamIcon = (team: Team) => {
    const teamType = team.tags?.type;
    switch (teamType) {
      case "department":
        return (
          <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case "team":
        return (
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
    }
  };

  const getMemberRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "admin":
        return "bg-red-50 text-red-700 border-red-200";
      case "member":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const hero = team ? (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {getTeamIcon(team)}
        <Pill label={team.id} />
      </div>
      {team.tags ? <Pill label={`${Object.keys(team.tags).length} tags`} /> : null}
      {members.length > 0 && <Pill label={`${members.length} members`} />}
    </div>
  ) : (
    "Team"
  );

  return (
    <AppShell
      title={team?.name || "Team detail"}
      description="Team members, services, incidents, and telemetry related to this team."
      hero={hero}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Link href="/teams" className="text-xs font-semibold text-[#0b1517] underline-offset-4 hover:underline">
            Back to all teams
          </Link>
          {team?.parent && (
            <Link 
              href={`/teams/${team.parent}`} 
              className="text-xs font-semibold text-blue-600 underline-offset-4 hover:underline"
            >
              Parent: {team.parent}
            </Link>
          )}
          {team?.tags ? (
            <span className="text-xs text-slate-600">
              Tags: {Object.entries(team.tags).map(([k, v]) => `${k}=${v}`).join(", ")}
            </span>
          ) : (
            <span className="text-xs text-slate-600">No tags provided</span>
          )}
          {errors.team ? <Pill label={errors.team} tone="error" /> : null}
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
            <button
              type="button"
              onClick={() => {
                loadTeam();
                loadMembers();
                if (team?.id) {
                  loadIncidents();
                }
              }}
              className="rounded-lg border border-[#8fdede] bg-white px-3 py-1 font-semibold text-[#0f1a1d] transition hover:border-[#55cfd0]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-800">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Team</p>
            <p className="font-semibold text-slate-900">{team?.name || teamId}</p>
          </div>
          {team?.parent ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Parent Organization</p>
              <p className="font-mono text-xs text-slate-700">{team.parent}</p>
            </div>
          ) : null}
          {team?.tags ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Tags</p>
              <p className="font-mono text-xs text-slate-700">
                {Object.entries(team.tags)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", ") || "None"}
              </p>
            </div>
          ) : null}
          {team?.metadata?.description ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Description</p>
              <p className="text-sm text-slate-700">{String(team.metadata.description)}</p>
            </div>
          ) : null}
          {team?.metadata?.services && Array.isArray(team.metadata.services) ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Services</p>
              <div className="flex flex-wrap gap-1">
                {(team.metadata.services as string[]).map((service) => (
                  <Link
                    key={service}
                    href={`/services/${service}`}
                    className="inline-block rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                  >
                    {service}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {team?.metadata && Object.keys(team.metadata).filter(k => k !== "description" && k !== "services").length > 0 ? (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Metadata</p>
              <pre className="overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
                {formatJson(
                  Object.fromEntries(
                    Object.entries(team.metadata).filter(([k]) => k !== "description" && k !== "services")
                  )
                )}
              </pre>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2">
          {tabOrder.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab.key
                ? "bg-[#55cfd0] text-[#0b1517] shadow"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "members" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
              {errors.members ? <Pill label={errors.members} tone="error" /> : null}
            </div>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {members.length === 0 ? (
                <p className="text-slate-500">No members found.</p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <span className="text-sm font-semibold text-slate-700">
                            {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-600">{member.email}</p>
                          {member.handle && (
                            <p className="text-xs text-slate-500">@{member.handle}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getMemberRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                    {member.metadata?.title ? (
                      <p className="mt-2 text-xs text-slate-600">
                        <span className="font-medium">Title:</span> {String(member.metadata.title)}
                      </p>
                    ) : null}
                    {member.metadata?.location ? (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Location:</span> {String(member.metadata.location)}
                      </p>
                    ) : null}
                    {member.metadata?.languages && Array.isArray(member.metadata.languages) ? (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-600 mb-1">Languages:</p>
                        <div className="flex flex-wrap gap-1">
                          {(member.metadata.languages as string[]).map((lang) => (
                            <span
                              key={lang}
                              className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "services" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Services owned by this team</h2>
            </div>
            {team?.metadata?.services && Array.isArray(team.metadata.services) && team.metadata.services.length > 0 ? (
              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                {(team.metadata.services as string[]).map((serviceId) => (
                  <button
                    key={serviceId}
                    type="button"
                    onClick={() => router.push(`/services/${serviceId}`)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-[#55cfd0] hover:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{serviceId}</p>
                          <p className="text-xs text-slate-600">Service owned by {team.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">→</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">No services assigned</p>
                <p className="mt-1 text-xs text-slate-500">This team doesn&apos;t own any services yet</p>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "incidents" ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Incidents for this team</h2>
              {errors.incidents ? <Pill label={errors.incidents} tone="error" /> : null}
            </div>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {incidents.length === 0 ? (
                <p className="text-slate-500">No incidents attached yet.</p>
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

        {activeTab === "alerts" ? (
          <AlertsPanel 
            initialQuery={team?.id ? { scope: { team: team.id } } : {}} 
            readOnly={true} 
          />
        ) : null}

        {activeTab === "logs" ? (
          <LogsPanel
            initialReference={{
              expression: { search: "*" },
              start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
            }}
            autoRun={true}
            readOnly={true}
          />
        ) : null}

        {activeTab === "metrics" ? (
          <MetricsPanel
            initialReference={{
              expression: { metricName: team?.name ? `team="${team.name}"` : "up" },
              start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
              step: 60,
            }}
            autoRun={true}
            readOnly={true}
          />
        ) : null}

        {activeTab === "tickets" ? (
          <TicketsPanel 
            readOnly={true} 
            initialScope={team?.id ? { team: team.id } : undefined}
          />
        ) : null}

      </div>
    </AppShell>
  );
}