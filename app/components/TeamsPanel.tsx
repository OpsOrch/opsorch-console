import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { queryTeams } from "@/app/lib/teams";
import { useAsyncState } from "@/app/lib/hooks";
import { Team } from "@/app/lib/types";
import { Badge, Field, Pill, Section, TextInput } from "@/app/lib/ui";
import { EmptyState } from "@/app/components/EmptyState";

type TeamsPanelProps = {
  initialName?: string;
};

export function TeamsPanel({ initialName }: TeamsPanelProps = {}) {
  const router = useRouter();
  const teamState = useAsyncState();
  const [teamName, setTeamName] = useState(initialName || "");
  const [teams, setTeams] = useState<Team[]>([]);

  const runSearch = async () => {
    teamState.start();
    try {
      const query = teamName.trim() ? { name: teamName } : {};
      const res = await queryTeams(query);
      setTeams(res);
      teamState.succeed();
    } catch (err) {
      teamState.fail(err);
    }
  };

  // Auto-run search on mount
  useEffect(() => {
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetToDefaults = () => {
    setTeamName("");
    requestAnimationFrame(() => {
      teamState.start();
      queryTeams({})
        .then(res => {
          setTeams(res);
          teamState.succeed();
        })
        .catch(err => teamState.fail(err));
    });
  };

  const isDefaultQuery = () => !teamName;

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

  const getTeamTypeColor = (type?: string) => {
    switch (type) {
      case "department":
        return "bg-purple-50";
      case "team":
        return "bg-blue-50";
      default:
        return "bg-slate-50";
    }
  };

  return (
    <Section
      title="Teams"
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
              value={teamName}
              onChange={setTeamName}
              placeholder="velocity, engineering, team"
            />
          }
        />
      </div>
      {teamState.error ? <Pill label={teamState.error} tone="error" /> : null}
      <div className="grid max-h-72 xl:max-h-[30rem] 2xl:max-h-[40rem] gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        {teamState.error ? (
          <EmptyState
            title="Error loading teams"
            description={teamState.error}
            variant="error"
            action={{ label: "Retry", onClick: runSearch }}
          />
        ) : teamState.loading && teams.length === 0 ? (
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
        ) : teams.length === 0 ? (
          <EmptyState
            title={isDefaultQuery() ? "No teams found" : "No matching teams"}
            description={isDefaultQuery() ? "There are no teams in the system." : "Try adjusting your search criteria or resetting to default."}
            variant="no-data"
            action={!isDefaultQuery() ? { label: "Reset to Default", onClick: resetToDefaults } : { label: "Refresh", onClick: runSearch }}
          />
        ) : (
          teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => router.push(`/teams/${team.id}`)}
              className="animate-fade-in group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[#55cfd0] hover:shadow-md"
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getTeamTypeColor(team.tags?.type)}`}>
                {getTeamIcon(team)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 group-hover:text-[#0f5f66]">{team.name}</p>
                  {team.tags?.type && (
                    <Badge
                      label={team.tags.type}
                      variant={team.tags.type === "department" ? "default" : "info"}
                      size="sm"
                    />
                  )}
                </div>
                {team.parent && (
                  <p className="mt-0.5 text-xs text-slate-600">
                    Parent: {team.parent}
                  </p>
                )}
                {team.tags && Object.keys(team.tags).length > 1 ? (
                  <p className="mt-0.5 text-xs text-slate-600">
                    {Object.entries(team.tags)
                      .filter(([k]) => k !== "type")
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")}
                  </p>
                ) : null}
                {team.metadata?.description ? (
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                    {String(team.metadata.description)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge label={team.id} variant="default" size="sm" />
                {team.metadata?.members_count ? (
                  <span className="text-xs text-slate-500">
                    {String(team.metadata.members_count)} members
                  </span>
                ) : null}
              </div>
            </button>
          ))
        )}
      </div>
    </Section >
  );
}